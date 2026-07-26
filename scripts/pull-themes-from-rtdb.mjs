/**
 * Pull theme_configs from Firebase RTDB and write config/themes/{id}.ts
 * Usage: node scripts/pull-themes-from-rtdb.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const THEME_IDS = ["zat", "newzat", "qydha"];
const EXPORT_NAME = {
  zat: "zatTheme",
  newzat: "newzatTheme",
  qydha: "qydhaTheme",
};
const FILE_HEADER = {
  zat: `/**
 * Harvested from Zat baloot landscape Vue screens + /config tuning.
 * Store still supplies live scores/names — this file is skin only.
 * Synced from RTDB theme_configs/zat.
 */`,
  newzat: `/**
 * Cloned from zat, then tuned via /config for newzat videos/assets.
 * Synced from RTDB theme_configs/newzat.
 */`,
  qydha: `/**
 * Harvested from Qydha baloot landscape Vue screens.
 * Store still supplies live scores/names — this file is skin only.
 * Synced from RTDB theme_configs/qydha.
 */`,
};

function loadEnv() {
  const text = readFileSync(resolve(root, ".env"), "utf8");
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

/** @param {unknown} value @param {number} indent */
function toTs(value, indent = 2) {
  const pad = " ".repeat(indent);
  const padInner = " ".repeat(indent + 2);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => `${padInner}${toTs(v, indent + 2)}`);
    return `[\n${items.join(",\n")},\n${pad}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    const lines = entries.map(
      ([k, v]) => `${padInner}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${toTs(v, indent + 2)}`,
    );
    return `{\n${lines.join(",\n")},\n${pad}}`;
  }
  return "undefined";
}

/**
 * Expand legacy cam into screen corners (Top.vue mapping):
 * topLeft←bottom, topRight←left, bottomLeft←right, bottomRight←top
 * @param {any} cam
 * @param {string} themeId
 */
function normalizeCam(cam, themeId) {
  if (!cam || typeof cam !== "object") return cam;
  const folder = themeId === "newzat" ? "newzat" : "zat";
  const defaults = {
    wrapWidthPx: 140,
    wrapHeightPx: 195,
    wrapLeftPx: 0,
    wrapTopPx: 0,
    frameWidthPx: 140,
    frameHeightPx: 195,
    frameLeftPx: 0,
    frameTopPx: 0,
    imageWidthPx: 140,
    imageHeightPx: 187,
    imageLeftPx: 0,
    imageTopPx: 5,
  };

  /** @param {any} partial @param {string} frameSrc */
  function seat(partial, frameSrc) {
    const src = partial || {};
    const shared = cam;
    return {
      frameSrc: src.frameSrc || frameSrc,
      wrapWidthPx: src.wrapWidthPx ?? shared.wrapWidthPx ?? defaults.wrapWidthPx,
      wrapHeightPx: src.wrapHeightPx ?? shared.wrapHeightPx ?? defaults.wrapHeightPx,
      wrapLeftPx: src.wrapLeftPx ?? shared.wrapLeftPx ?? defaults.wrapLeftPx,
      wrapTopPx: src.wrapTopPx ?? shared.wrapTopPx ?? defaults.wrapTopPx,
      frameWidthPx: src.frameWidthPx ?? shared.frameWidthPx ?? defaults.frameWidthPx,
      frameHeightPx: src.frameHeightPx ?? shared.frameHeightPx ?? defaults.frameHeightPx,
      frameLeftPx: src.frameLeftPx ?? shared.frameLeftPx ?? defaults.frameLeftPx,
      frameTopPx: src.frameTopPx ?? shared.frameTopPx ?? defaults.frameTopPx,
      imageWidthPx: src.imageWidthPx ?? shared.imageWidthPx ?? defaults.imageWidthPx,
      imageHeightPx: src.imageHeightPx ?? shared.imageHeightPx ?? defaults.imageHeightPx,
      imageLeftPx: src.imageLeftPx ?? shared.imageLeftPx ?? defaults.imageLeftPx,
      imageTopPx: src.imageTopPx ?? shared.imageTopPx ?? defaults.imageTopPx,
    };
  }

  const usSrc =
    cam.bottomRight?.frameSrc ||
    cam.top?.frameSrc ||
    cam.us?.frameSrc ||
    cam.usFrameSrc ||
    `/images/${folder}/usframe.svg`;
  const themSrc =
    cam.topRight?.frameSrc ||
    cam.left?.frameSrc ||
    cam.them?.frameSrc ||
    cam.themFrameSrc ||
    `/images/${folder}/themframe.svg`;

  if (cam.topLeft && cam.topRight && cam.bottomLeft && cam.bottomRight) {
    return {
      topLeft: seat(cam.topLeft, usSrc),
      topRight: seat(cam.topRight, themSrc),
      bottomLeft: seat(cam.bottomLeft, themSrc),
      bottomRight: seat(cam.bottomRight, usSrc),
    };
  }

  // Old player-seat keys → corners (Top cam screen mapping)
  return {
    topLeft: seat(cam.topLeft || cam.bottom || cam.us, usSrc),
    topRight: seat(cam.topRight || cam.left || cam.them, themSrc),
    bottomLeft: seat(cam.bottomLeft || cam.right || cam.them, themSrc),
    bottomRight: seat(cam.bottomRight || cam.top || cam.us, usSrc),
  };
}

/** @param {any} config @param {string} themeId */
function cleanConfig(config, themeId) {
  const { updatedAt: _u, ...rest } = config;
  const out = structuredClone(rest);
  out.id = themeId;
  if (out.landscape?.baloot?.cam) {
    out.landscape.baloot.cam = normalizeCam(out.landscape.baloot.cam, themeId);
  }
  return out;
}

function writeThemeFile(themeId, config) {
  const cleaned = cleanConfig(config, themeId);
  const name = EXPORT_NAME[themeId];
  const body = `import type { ThemeConfig } from "./types";

${FILE_HEADER[themeId]}
export const ${name}: ThemeConfig = ${toTs(cleaned, 0)};
`;
  const path = resolve(root, `config/themes/${themeId}.ts`);
  writeFileSync(path, body, "utf8");
  console.log(`Wrote ${path}`);
}

async function main() {
  const env = loadEnv();
  const firebaseConfig = {
    apiKey: env.apiKey || "",
    authDomain: env.authDomain || "",
    projectId: env.projectId || "",
    appId: env.appId || "",
    databaseURL: env.databaseURL || "",
    storageBucket: env.storageBucket || "",
    messagingSenderId: env.messagingSenderId || "",
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
    console.error("Missing apiKey or databaseURL in .env");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInAnonymously(auth);
  const db = getDatabase(app);

  let wrote = 0;
  for (const id of THEME_IDS) {
    const snap = await get(ref(db, `theme_configs/${id}`));
    if (!snap.exists()) {
      console.warn(`No RTDB data for theme_configs/${id} — skipped`);
      continue;
    }
    const val = snap.val();
    if (!val || typeof val !== "object" || !val.landscape) {
      console.warn(`Invalid shape for theme_configs/${id} — skipped`);
      continue;
    }
    writeThemeFile(id, val);
    wrote++;
  }

  console.log(`Done. Updated ${wrote}/${THEME_IDS.length} theme file(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
