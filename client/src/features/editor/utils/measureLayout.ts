import type { Measure } from './measureUtils';

export interface MeasureLayout {
  measureIndex: number;
  x: number;
  y: number;
  width: number;
  isFirstOnLine: boolean;
  isFirstMeasure: boolean;
  isLastMeasure: boolean;
  lineIndex: number;
}

const STAVE_HEIGHT = 90; // vertical space per stave line (stave + gap) in logical units
const CLEF_WIDTH = 40; // extra width for clef at start of each line
const TIME_SIG_WIDTH = 30; // extra width for time signature on first measure
const KEY_SIG_WIDTH = 20; // extra width for key signature on first measure
const MIN_MEASURE_WIDTH = 120;
const STAVE_PADDING = 10; // left margin only (right edge = container edge)

/** Get the fixed decoration overhead for a measure (clef, time sig, key sig). */
function getDecorationWidth(
  measureIndex: number,
  isFirstOnLine: boolean,
  hasKeySig: boolean,
): number {
  let w = 0;
  if (isFirstOnLine) w += CLEF_WIDTH;
  if (measureIndex === 0) {
    w += TIME_SIG_WIDTH;
    if (hasKeySig) w += KEY_SIG_WIDTH;
  }
  return w;
}

/**
 * Compute the layout (position + size) for each measure.
 * Two-pass algorithm:
 *   Pass 1 — assign measures to lines using minimum widths.
 *   Pass 2 — stretch measures on each line to fill the full container width.
 */
export function computeMeasureLayout(
  measures: Measure[],
  containerWidth: number,
  _beatsPerMeasure: number,
  hasKeySig: boolean,
): MeasureLayout[] {
  if (measures.length === 0 || containerWidth <= 0) return [];

  const usableWidth = containerWidth - STAVE_PADDING;

  // --- Pass 1: assign measures to lines based on minimum widths ---
  const lines: number[][] = [[]];
  let lineUsed = 0;

  for (let i = 0; i < measures.length; i++) {
    const isLineStart = lines[lines.length - 1].length === 0;
    const decorW = getDecorationWidth(i, isLineStart || i === 0, hasKeySig);
    const minW = MIN_MEASURE_WIDTH + decorW;

    if (!isLineStart && lineUsed + minW > usableWidth) {
      // Wrap to a new line
      lines.push([i]);
      const newDecorW = getDecorationWidth(i, true, hasKeySig);
      lineUsed = MIN_MEASURE_WIDTH + newDecorW;
    } else {
      lines[lines.length - 1].push(i);
      lineUsed += minW;
    }
  }

  // --- Pass 2: stretch each line's measures to fill usableWidth ---
  const layouts: MeasureLayout[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineIndices = lines[lineIdx];

    // Sum of beats and fixed overhead on this line
    let totalBeats = 0;
    let totalFixed = 0;
    for (const mi of lineIndices) {
      totalBeats += measures[mi].totalBeats;
      const isFirst = mi === lineIndices[0];
      totalFixed += getDecorationWidth(mi, isFirst, hasKeySig);
    }

    // Width available for beat-proportional distribution
    const beatSpace = Math.max(0, usableWidth - totalFixed);
    const beatWidth = totalBeats > 0 ? beatSpace / totalBeats : 0;

    let x = STAVE_PADDING;

    for (const mi of lineIndices) {
      const isFirstOnLine = mi === lineIndices[0];
      const isFirstMeasure = mi === 0;
      const decorW = getDecorationWidth(mi, isFirstOnLine, hasKeySig);
      const width = Math.max(
        MIN_MEASURE_WIDTH,
        measures[mi].totalBeats * beatWidth + decorW,
      );

      layouts.push({
        measureIndex: mi,
        x,
        y: lineIdx * STAVE_HEIGHT + 30,
        width,
        isFirstOnLine,
        isFirstMeasure,
        isLastMeasure: mi === measures.length - 1,
        lineIndex: lineIdx,
      });

      x += width;
    }
  }

  return layouts;
}

/** Compute the total SVG height needed for all stave lines. */
export function computeTotalHeight(layouts: MeasureLayout[]): number {
  if (layouts.length === 0) return 200;
  const maxLine = layouts[layouts.length - 1].lineIndex;
  return (maxLine + 1) * STAVE_HEIGHT + 60;
}
