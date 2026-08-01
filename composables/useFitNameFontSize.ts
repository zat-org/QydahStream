import { fitTextFontSize } from "~/utils/fit-text-width";

/**
 * Fit team name font size to the configured name width box.
 * maxFontPx comes from theme config (nameFontSizePx); result overrides it.
 */
export function useFitNameFontSize() {
  const usNameEl = ref<HTMLElement | null>(null);
  const themNameEl = ref<HTMLElement | null>(null);
  const usFittedPx = ref<number | null>(null);
  const themFittedPx = ref<number | null>(null);

  function measure(
    usMaxPx: number | null | undefined,
    themMaxPx: number | null | undefined,
  ) {
    if (usNameEl.value && usMaxPx != null) {
      usFittedPx.value = fitTextFontSize(usNameEl.value, usMaxPx);
    } else {
      usFittedPx.value = usMaxPx ?? null;
    }
    if (themNameEl.value && themMaxPx != null) {
      themFittedPx.value = fitTextFontSize(themNameEl.value, themMaxPx);
    } else {
      themFittedPx.value = themMaxPx ?? null;
    }
  }

  function refit(
    usMaxPx: number | null | undefined,
    themMaxPx: number | null | undefined,
  ) {
    nextTick(() => {
      requestAnimationFrame(() => {
        measure(usMaxPx, themMaxPx);
        // Re-measure after webfonts settle (arefBold / theme fonts).
        if (typeof document !== "undefined" && document.fonts?.ready) {
          document.fonts.ready.then(() => measure(usMaxPx, themMaxPx));
        }
      });
    });
  }

  return {
    usNameEl,
    themNameEl,
    usFittedPx,
    themFittedPx,
    refit,
  };
}
