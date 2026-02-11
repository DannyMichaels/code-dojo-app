import type { StaveNote } from 'vexflow';

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
