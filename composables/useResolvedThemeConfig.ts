import type { ThemeConfig } from "~/config/themes/types";
import { getThemeConfig } from "~/config/themes";
import {
  subscribeThemeConfig,
  type ThemeConfigSource,
} from "~/utils/theme-config-rtdb";

function cloneTheme(themeId: string): ThemeConfig | null {
  const file = getThemeConfig(themeId);
  return file ? (JSON.parse(JSON.stringify(file)) as ThemeConfig) : null;
}

/**
 * 1) Sync: local file defaults (instant — video can start immediately)
 * 2) Async: RTDB subscription updates config when ready (live, no refresh)
 */
export function useResolvedThemeConfig(
  themeId: Ref<string> | ComputedRef<string>,
) {
  const config = ref<ThemeConfig | null>(cloneTheme(unref(themeId)));
  const source = ref<ThemeConfigSource | null>(config.value ? "file" : null);
  /** True only while waiting for first RTDB snapshot (file already applied). */
  const loadingRemote = ref(false);
  const error = ref<string | null>(null);

  let unsubscribe: (() => void) | null = null;

  function startSubscription(id: string) {
    unsubscribe?.();
    unsubscribe = null;

    // Instant defaults from repo file
    config.value = cloneTheme(id);
    source.value = config.value ? "file" : null;
    loadingRemote.value = true;
    error.value = null;

    try {
      unsubscribe = subscribeThemeConfig(id, (result) => {
        // Keep showing file until RTDB actually has data
        if (result.source === "rtdb" && result.config) {
          config.value = result.config;
          source.value = "rtdb";
        } else if (result.source === "file" && result.config && !config.value) {
          config.value = result.config;
          source.value = "file";
        }
        if (result.source === "rtdb") {
          loadingRemote.value = false;
        }
      });
      // Don't block UI on Firebase — clear remote loading after a short grace
      // if RTDB never responds (still use file)
      window.setTimeout(() => {
        loadingRemote.value = false;
      }, 4000);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to subscribe theme config";
      loadingRemote.value = false;
    }
  }

  watch(
    () => unref(themeId),
    (id) => {
      startSubscription(id);
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return {
    config,
    source,
    /** @deprecated use loadingRemote — file is never "loading" */
    loading: loadingRemote,
    loadingRemote,
    error,
    reload: () => startSubscription(unref(themeId)),
  };
}
