import {
  clearClientErrors,
  clientErrorEntries,
  exportClientErrorsJson,
  initClientErrorLogFromStorage,
  pushClientError,
  pushClientErrorFromUnknown,
} from "~/utils/client-error-log";

export default defineNuxtPlugin({
  name: "error-logger",
  enforce: "pre",
  setup(nuxtApp) {
    initClientErrorLogFromStorage();

    const router = useRouter();
    const routeLabel = () =>
      router.currentRoute.value?.fullPath ?? window.location.pathname;

    if (import.meta.client) {
      (
        window as unknown as {
          __QYDAH_CLIENT_ERROR_LOG__?: {
            getEntries: () => readonly unknown[];
            exportJson: () => string;
            clear: () => void;
          };
        }
      ).__QYDAH_CLIENT_ERROR_LOG__ = {
        getEntries: () => clientErrorEntries.value,
        exportJson: exportClientErrorsJson,
        clear: clearClientErrors,
      };
    }

    nuxtApp.vueApp.config.errorHandler = (err, _instance, info) => {
      pushClientError({
        category: "vue",
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        route: routeLabel(),
        extra: { info },
      });
    };

    window.addEventListener("error", (event) => {
      const t = event.target as HTMLElement | null;
      if (t?.tagName === "SCRIPT" || t?.tagName === "LINK") {
        const src =
          (t as HTMLScriptElement).src || (t as HTMLLinkElement).href || "";
        pushClientError({
          category: "resource",
          message: event.message || "Failed to load resource",
          route: routeLabel(),
          extra: {
            tag: t.tagName,
            src,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
        return;
      }
      if (event.error) {
        pushClientErrorFromUnknown("js_global", event.error, {
          route: routeLabel(),
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      } else if (event.message) {
        pushClientError({
          category: "js_global",
          message: event.message,
          route: routeLabel(),
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      const msg = String(
        event.reason instanceof Error
          ? event.reason.message
          : event.reason ?? "",
      );
      const isChunk =
        /Failed to fetch dynamically imported module|Loading chunk \d+ failed|ChunkLoadError|Importing a module script failed/i.test(
          msg,
        );
      pushClientErrorFromUnknown("promise", event.reason, {
        route: routeLabel(),
        chunkSuspected: isChunk,
      });
    });

    const config = useRuntimeConfig();
    const remoteUrl = config.public.errorReportUrl as string | undefined;

    nuxtApp.hook("app:error", (err) => {
      pushClientErrorFromUnknown("vue", err, {
        route: routeLabel(),
        hook: "app:error",
      });
      if (
        remoteUrl &&
        typeof navigator !== "undefined" &&
        navigator.sendBeacon
      ) {
        try {
          navigator.sendBeacon(
            remoteUrl,
            JSON.stringify({
              t: Date.now(),
              route: routeLabel(),
              message: err instanceof Error ? err.message : String(err),
            }),
          );
        } catch {
          /* ignore */
        }
      }
    });
  },
});
