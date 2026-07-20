import type { ThemeConfig } from "~/config/themes/types";
import {
  resolveThemeConfig,
  type ThemeConfigSource,
} from "~/utils/theme-config-rtdb";

/**
 * Reactive theme skin: RTDB override || local file.
 */
export function useResolvedThemeConfig(themeId: Ref<string> | ComputedRef<string>) {
  const config = ref<ThemeConfig | null>(null);
  const source = ref<ThemeConfigSource | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function reload() {
    loading.value = true;
    error.value = null;
    try {
      const result = await resolveThemeConfig(unref(themeId));
      config.value = result.config;
      source.value = result.source;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to resolve theme config";
      config.value = null;
      source.value = null;
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => unref(themeId),
    () => {
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
