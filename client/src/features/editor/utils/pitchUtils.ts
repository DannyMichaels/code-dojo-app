export const TREBLE_PITCHES = [
  'a/5', 'g/5', 'f/5', 'e/5', 'd/5', 'c/5', 'b/4', 'a/4', 'g/4', 'f/4',
  'e/4', 'd/4', 'c/4', 'b/3', 'a/3',
];

export const BASS_PITCHES = [
  'c/4', 'b/3', 'a/3', 'g/3', 'f/3', 'e/3', 'd/3', 'c/3', 'b/2', 'a/2',
  'g/2', 'f/2', 'e/2', 'd/2', 'c/2',
];

export const ALTO_PITCHES = [
  'b/5', 'a/5', 'g/5', 'f/5', 'e/5', 'd/5', 'c/5', 'b/4', 'a/4', 'g/4',
  'f/4', 'e/4', 'd/4', 'c/4', 'b/3',
];

export function getPitchesForClef(clef: string): string[] {
  switch (clef) {
    case 'bass': return BASS_PITCHES;
    case 'alto': return ALTO_PITCHES;
    default: return TREBLE_PITCHES;
  }
}

/**
 * Shift a pitch up or down one diatonic step within the clef's pitch array.
 */
export function shiftPitch(
  pitch: string,
  direction: 'up' | 'down',
  clef: string,
): string {
  const pitches = getPitchesForClef(clef);
  const idx = pitches.indexOf(pitch);
  if (idx === -1) return pitch;
  // "up" means higher pitch = lower index in the array
  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (newIdx < 0 || newIdx >= pitches.length) return pitch;
  return pitches[newIdx];
}

/**
 * Convert VexFlow pitch notation (e.g. "c/4") + optional accidental to
 * Tone.js notation (e.g. "C4", "C#4", "Bb3").
 */
export function vexflowPitchToTone(pitch: string, accidental?: string | null): string {
  const [note, octave] = pitch.split('/');
  const base = note.toUpperCase();
  const acc = accidental === '#' ? '#' : accidental === 'b' ? 'b' : '';
  return `${base}${acc}${octave}`;
}
