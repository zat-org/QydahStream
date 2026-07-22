import type { ThemeConfig } from "./types";
import { qydhaTheme } from "./qydha";
import { zatTheme } from "./zat";

const themes: Record<string, ThemeConfig> = {
  zat: zatTheme,
  qydha: qydhaTheme,
};

export function getThemeConfig(themeId: string): ThemeConfig | null {
  return themes[themeId] ?? null;
}

export function listThemeIds(): string[] {
  return Object.keys(themes);
}

export { qydhaTheme, zatTheme };
