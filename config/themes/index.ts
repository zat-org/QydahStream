import type { ThemeConfig } from "./types";
import { qydhaTheme } from "./qydha";

const themes: Record<string, ThemeConfig> = {
  qydha: qydhaTheme,
};

export function getThemeConfig(themeId: string): ThemeConfig | null {
  return themes[themeId] ?? null;
}

export function listThemeIds(): string[] {
  return Object.keys(themes);
}

export { qydhaTheme };
