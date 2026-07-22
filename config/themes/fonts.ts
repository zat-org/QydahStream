/**
 * Theme overlay fonts — must match @font-face names in assets/css/fonts.css.
 */
export const THEME_FONT_OPTIONS = [
  {
    id: "arefBold",
    label: "Aref Ruqaa Bold",
    file: "ArefRuqaa-Bold.ttf",
  },
  {
    id: "CairoSemiBold",
    label: "Cairo SemiBold",
    file: "Cairo-SemiBold.ttf",
  },
  {
    id: "DinNextRegular",
    label: "DIN Next Regular",
    file: "din-next-lt-w23-regular.ttf",
  },
] as const;

export type ThemeFontId = (typeof THEME_FONT_OPTIONS)[number]["id"];

const FONT_IDS = new Set<string>(THEME_FONT_OPTIONS.map((f) => f.id));

export function isThemeFontId(value: unknown): value is ThemeFontId {
  return typeof value === "string" && FONT_IDS.has(value);
}

/** CSS font-family value for inline styles; empty if unset/invalid. */
export function themeFontCss(family?: string | null): string | undefined {
  if (!family || !isThemeFontId(family)) return undefined;
  return family;
}
