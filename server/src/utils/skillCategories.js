export const TECH_CATEGORIES = new Set(['technology']);

export function isTechCategory(category) {
  return TECH_CATEGORIES.has(category || 'technology');
}

export const MUSIC_CATEGORIES = new Set(['music']);

export function isMusicCategory(category) {
  return MUSIC_CATEGORIES.has(category || 'technology');
}
