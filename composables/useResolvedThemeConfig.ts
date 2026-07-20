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
 * Live theme skin: local file first, then RTDB with realtime updates (no refresh needed).
 */
export function useResolvedThemeConfig(
  themeId: Ref<string> | ComputedRef<string>,
) {
  const config = ref<ThemeConfig | null>(cloneTheme(unref(themeId)));
  const source = ref<ThemeConfigSource | null>(config.value ? "file" : null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let unsubscribe: (() => void) | null = null;

  async function startSubscription(id: string) {
    unsubscribe?.();
    unsubscribe = null;

    config.value = cloneTheme(id);
    source.value = config.value ? "file" : null;
    loading.value = true;
    error.value = null;

    try {
      unsubscribe = await subscribeThemeConfig(id, (result) => {
        config.value = result.config;
        source.value = result.source;
        loading.value = false;
      });
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to subscribe theme config";
      if (!config.value) {
        config.value = cloneTheme(id);
        source.value = config.value ? "file" : null;
      }
      loading.value = false;
    }
  }

  watch(
    () => unref(themeId),
    (id) => {
      void startSubscription(id);
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
    loading,
    error,
    reload: () => startSubscription(unref(themeId)),
  };
}
