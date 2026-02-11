export const TECH_CATEGORIES = new Set(['technology']);

export function isTechCategory(category?: string): boolean {
  return TECH_CATEGORIES.has(category || 'technology');
}

export const MUSIC_CATEGORIES = new Set(['music']);

export function isMusicCategory(category?: string): boolean {
  return MUSIC_CATEGORIES.has(category || 'technology');
}
