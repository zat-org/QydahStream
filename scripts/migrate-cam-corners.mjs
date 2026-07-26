import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function toTs(value, indent = 2) {
  const pad = " ".repeat(indent);
  const padInner = " ".repeat(indent + 2);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return `[\n${value.map((v) => `${padInner}${toTs(v, indent + 2)}`).join(",\n")},\n${pad}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    return `{\n${entries
      .map(
        ([k, v]) =>
          `${padInner}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${toTs(v, indent + 2)}`,
      )
      .join(",\n")},\n${pad}}`;
  }
  return "undefined";
}

function migrateCam(cam, themeId) {
  if (!cam || typeof cam !== "object") return cam;
  if (cam.topLeft && cam.topRight && cam.bottomLeft && cam.bottomRight) {
    return cam;
  }
  const folder = themeId === "newzat" ? "newzat" : "zat";
  const us = `/images/${folder}/usframe.svg`;
  const them = `/images/${folder}/themframe.svg`;
  const pick = (partial, fb) => ({
    frameSrc: partial?.frameSrc || fb,
    ...(partial || {}),
  });
  // Top.vue mapping — keeps tuned wrap offsets on the same screen corners
  return {
    topLeft: pick(cam.bottom || cam.us, us),
    topRight: pick(cam.left || cam.them, them),
    bottomLeft: pick(cam.right || cam.them, them),
    bottomRight: pick(cam.top || cam.us, us),
  };
}

const meta = {
  zat: {
    name: "zatTheme",
    header: `Harvested from Zat baloot landscape Vue screens + /config tuning.
 * Store still supplies live scores/names — this file is skin only.`,
  },
  newzat: {
    name: "newzatTheme",
    header: `Cloned from zat, then tuned via /config for newzat videos/assets.`,
  },
  qydha: {
    name: "qydhaTheme",
    header: `Harvested from Qydha baloot landscape Vue screens.
 * Store still supplies live scores/names — this file is skin only.`,
  },
};

for (const id of Object.keys(meta)) {
  const file = resolve(root, `config/themes/${id}.ts`);
  const text = readFileSync(file, "utf8");
  const m = text.match(/export const \w+: ThemeConfig = (\{[\s\S]*\});?\s*$/);
  if (!m) {
    console.error("parse fail", id);
    continue;
  }
  const obj = (0, eval)(`(${m[1]})`);
  if (obj.landscape?.baloot?.cam) {
    obj.landscape.baloot.cam = migrateCam(obj.landscape.baloot.cam, id);
  }
  const { name, header } = meta[id];
  const body = `import type { ThemeConfig } from "./types";

/**
 * ${header}
 * Cam layout keyed by screen corner (topLeft / topRight / bottomLeft / bottomRight).
 */
export const ${name}: ThemeConfig = ${toTs(obj, 0)};
`;
  writeFileSync(file, body);
  console.log("migrated", id, Object.keys(obj.landscape.baloot.cam));
}
