/** Map VexFlow duration codes to Tone.js duration strings. */
export const VEXFLOW_TO_TONE: Record<string, string> = {
  w: '1n',
  h: '2n',
  q: '4n',
  '8': '8n',
  '16': '16n',
  // dotted variants
  wd: '1n.',
  hd: '2n.',
  qd: '4n.',
  '8d': '8n.',
  '16d': '16n.',
};

/** Get the base duration without dot suffix or rest marker. */
export function getBaseDuration(dur: string): string {
  return dur.replace(/[dr]/g, '');
}

/** Whether a duration string represents a dotted note. */
export function isDotted(dur: string): boolean {
  return dur.includes('d') && !dur.endsWith('r');
}

/** Whether a duration string represents a rest. */
export function isRest(dur: string): boolean {
  return dur.endsWith('r');
}

/** Toggle the dotted state of a duration string. */
export function toggleDotted(dur: string): string {
  if (isDotted(dur)) {
    // Remove 'd' — it appears right after the base duration digits
    return dur.replace('d', '');
  }
  // Insert 'd' before 'r' if rest, else at the end
  if (isRest(dur)) {
    return dur.replace('r', 'dr');
  }
  return dur + 'd';
}

/** Convert a VexFlow duration to Tone.js duration, handling dots and rests. */
export function vexflowDurationToTone(dur: string): string | null {
  if (isRest(dur)) return null; // rests produce silence
  const key = getBaseDuration(dur) + (isDotted(dur) ? 'd' : '');
  return VEXFLOW_TO_TONE[key] ?? '4n';
}
