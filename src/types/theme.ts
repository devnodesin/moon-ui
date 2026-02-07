export type Theme = 'autumn' | 'abyss';

export const THEMES: Record<'light' | 'dark', Theme> = {
  light: 'autumn',
  dark: 'abyss',
} as const;

export const THEME_STORAGE_KEY = 'moon-theme';
