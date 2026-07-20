import type { ThemeConfig } from "~/config/themes/types";
import { getThemeConfig } from "~/config/themes";
import {
  resolveThemeConfig,
  type ThemeConfigSource,
} from "~/utils/theme-config-rtdb";

function cloneTheme(themeId: string): ThemeConfig | null {
  const file = getThemeConfig(themeId);
  return file ? (JSON.parse(JSON.stringify(file)) as ThemeConfig) : null;
}

/**
 * Reactive theme skin: start from local file (sync), then RTDB override if present.
 * Sync seed avoids ScoreLandscape missing the first score.intro while Firebase loads.
 */
export function useResolvedThemeConfig(
  themeId: Ref<string> | ComputedRef<string>,
) {
  const config = ref<ThemeConfig | null>(cloneTheme(unref(themeId)));
  const source = ref<ThemeConfigSource | null>(config.value ? "file" : null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function reload() {
    const id = unref(themeId);
    // Keep file visible immediately while RTDB resolves
    if (!config.value) {
      config.value = cloneTheme(id);
      source.value = config.value ? "file" : null;
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await resolveThemeConfig(id);
      config.value = result.config;
      source.value = result.source;
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to resolve theme config";
      // keep file seed if RTDB failed
      if (!config.value) {
        config.value = cloneTheme(id);
        source.value = config.value ? "file" : null;
      }
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => unref(themeId),
    () => {
      config.value = cloneTheme(unref(themeId));
      source.value = config.value ? "file" : null;
      void reload();
    },
    { immediate: true },
  );

  return {
    config,
    source,
    loading,
    error,
    reload,
  };
}
