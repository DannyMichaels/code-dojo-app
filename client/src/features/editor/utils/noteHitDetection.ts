import type { StaveNote } from 'vexflow';
import { getPitchesForClef } from './pitchUtils';

/**
 * Find which note index was clicked, using the stored StaveNote references.
 * Returns -1 if no note was hit.
 */
export function getNoteIndexAtPoint(
  x: number,
  y: number,
  staveNotes: StaveNote[],
  tolerance = 12,
): number {
  for (let i = 0; i < staveNotes.length; i++) {
    try {
      const bb = staveNotes[i].getBoundingBox();
      if (
        x >= bb.getX() - tolerance &&
        x <= bb.getX() + bb.getW() + tolerance &&
        y >= bb.getY() - tolerance &&
        y <= bb.getY() + bb.getH() + tolerance
      ) {
        return i;
      }
    } catch {
      // getBoundingBox can throw if note hasn't been rendered yet
    }
  }
  return -1;
}

/**
 * Set `data-note-index` attribute on each rendered StaveNote's SVG element.
 */
/**
 * Given a chord's keys array, a logical Y position, a getClickPitch function,
 * and the clef, resolve which key index in the chord was targeted.
 * Returns 0 for single-key notes or if resolution fails.
 */
export function resolveKeyIndexForNote(
  keys: string[],
  logicalY: number,
  getClickPitch: (logicalY: number) => string | null,
  clef: string,
): number {
  if (keys.length <= 1) return 0;
  const clickedPitch = getClickPitch(logicalY);
  if (!clickedPitch) return 0;
  const pitches = getPitchesForClef(clef);
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < keys.length; i++) {
    const dist = Math.abs(pitches.indexOf(keys[i]) - pitches.indexOf(clickedPitch));
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export function applyNoteIndexAttributes(staveNotes: StaveNote[]): void {
  for (let i = 0; i < staveNotes.length; i++) {
    try {
      const el = staveNotes[i].getSVGElement();
      if (el) {
        el.setAttribute('data-note-index', String(i));
      }
    } catch {
      // getSVGElement may not be available if not rendered
    }
  }
}
