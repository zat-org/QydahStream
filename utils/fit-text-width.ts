let measureCanvas: HTMLCanvasElement | null = null;

function textWidthAt(el: HTMLElement, text: string, fontSizePx: number): number {
  const style = getComputedStyle(el);
  const font = [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    `${fontSizePx}px`,
    style.fontFamily,
  ]
    .filter(Boolean)
    .join(" ");

  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Binary-search a font size so single-line text fills its box width
 * without overflowing. Short names grow up to maxPx; long names shrink.
 */
export function fitTextFontSize(
  el: HTMLElement,
  maxPx: number,
  minPx = 10,
): number {
  const boxW = el.clientWidth;
  const text = (el.textContent ?? "").trim();
  if (!boxW || maxPx <= 0 || !text) return maxPx;

  if (textWidthAt(el, text, maxPx) <= boxW) return maxPx;

  let lo = minPx;
  let hi = maxPx;
  let best = minPx;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (textWidthAt(el, text, mid) <= boxW) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
