/**
 * After a new Netlify deploy, hashed chunks under /_nuxt/ change. Tabs still
 * running the old bundle request obsolete filenames → dynamic import fails.
 * Recover by reloading once so the browser fetches the current HTML + assets.
 */
import { pushClientError } from "~/utils/client-error-log";

const STORAGE_TS_KEY = "qydah:chunk-reload-ts";
const DEBOUNCE_MS = 4000;

function isChunkLoadError(reason: unknown): boolean {
  const msg =
    reason instanceof Error ? reason.message : String(reason ?? "");
  return /Failed to fetch dynamically imported module|Loading chunk \d+ failed|ChunkLoadError|Importing a module script failed/i.test(
    msg,
  );
}

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();

  const routeLabel = () =>
    router.currentRoute.value?.fullPath ?? window.location.pathname;

  const reloadOnce = (source: "router" | "promise" | "script", detail?: string) => {
    const now = Date.now();
    const prev = sessionStorage.getItem(STORAGE_TS_KEY);
    const debounced = !!(prev && now - Number(prev) < DEBOUNCE_MS);

    if (debounced) {
      pushClientError({
        category: "chunk_reload_skipped_debounce",
        message:
          "Stale chunk recovery skipped (debounce) — hard refresh may be needed",
        route: routeLabel(),
        extra: { source, detail, debounceMs: DEBOUNCE_MS },
      });
      return;
    }

    sessionStorage.setItem(STORAGE_TS_KEY, String(now));
    pushClientError({
      category: "chunk_reload_scheduled",
      message:
        "Stale build chunk detected; scheduling full reload to fetch current assets",
      route: routeLabel(),
      extra: { source, detail },
    });
    window.location.reload();
  };

  router.onError((error) => {
    if (isChunkLoadError(error)) reloadOnce("router", error.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    reloadOnce(
      "promise",
      event.reason instanceof Error
        ? event.reason.message
        : String(event.reason ?? ""),
    );
  });

  window.addEventListener(
    "error",
    (event) => {
      const t = event.target as HTMLElement | null;
      if (t?.tagName === "SCRIPT") {
        const src = (t as HTMLScriptElement).src ?? "";
        if (src.includes("/_nuxt/")) reloadOnce("script", src);
      }
    },
    true,
  );

  nuxtApp.hook("app:mounted", () => {
    sessionStorage.removeItem(STORAGE_TS_KEY);
  });
});
