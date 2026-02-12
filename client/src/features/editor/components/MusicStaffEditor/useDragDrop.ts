import { useCallback, useEffect, useRef, useState } from 'react';
import type { StaveNote } from 'vexflow';
import type { NoteData } from './MusicStaffEditor';
import { getNoteIndexAtPoint, resolveKeyIndexForNote } from '../../utils/noteHitDetection';
import { getPitchesForClef } from '../../utils/pitchUtils';

export interface UseDragDropReturn {
  isDragging: boolean;
  dragIndex: number | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
}

const DRAG_THRESHOLD = 4; // pixels before drag activates

export function useDragDrop(
  notes: NoteData[],
  onNotesChange: (notes: NoteData[]) => void,
  staveNotesRef: React.RefObject<StaveNote[]>,
  screenToLogical: (x: number, y: number) => { x: number; y: number } | null,
  getClickPitch: (logicalY: number) => string | null,
  clef: string,
): UseDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragActivatedRef = useRef(false);
  const currentPitchRef = useRef<string | null>(null);
  const dragKeyIndexRef = useRef<number>(0);
  const swapPendingRef = useRef(false);
  const notesRef = useRef(notes);
  notesRef.current = notes;

  // Reset swap guard each render so the next mouse-move can trigger a swap
  swapPendingRef.current = false;

  // Clean up if mouse leaves the window during drag
  useEffect(() => {
    if (!dragActivatedRef.current && dragIndexRef.current === null) return;
    const handleGlobalMouseUp = () => {
      dragIndexRef.current = null;
      dragStartRef.current = null;
      dragActivatedRef.current = false;
      currentPitchRef.current = null;
      dragKeyIndexRef.current = 0;
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const logical = screenToLogical(e.clientX, e.clientY);
      if (!logical) return;

      const hitIdx = getNoteIndexAtPoint(logical.x, logical.y, staveNotesRef.current ?? []);
      if (hitIdx >= 0) {
        const note = notesRef.current[hitIdx];
        const ki = resolveKeyIndexForNote(note?.keys ?? [], logical.y, getClickPitch, clef);
        dragIndexRef.current = hitIdx;
        dragKeyIndexRef.current = ki;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        dragActivatedRef.current = false;
        currentPitchRef.current = note?.keys[ki] ?? null;
        e.preventDefault();
      }
    },
    [staveNotesRef, screenToLogical, getClickPitch, clef],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragIndexRef.current === null || !dragStartRef.current) return;

      // Check threshold before activating drag
      if (!dragActivatedRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        dragActivatedRef.current = true;
        setIsDragging(true);
      }

      const logical = screenToLogical(e.clientX, e.clientY);
      if (!logical) return;

      let idx = dragIndexRef.current;
      let currentNotes = notesRef.current;

      // --- Vertical: re-pitch the dragged key ---
      const newPitch = getClickPitch(logical.y);
      if (newPitch && newPitch !== currentPitchRef.current) {
        currentPitchRef.current = newPitch;
        const note = currentNotes[idx];
        if (note) {
          const ki = dragKeyIndexRef.current;
          const pitches = getPitchesForClef(clef);

          // Build new keys + accidentals, updating only the dragged key
          const newKeys = [...note.keys];
          const newAcc = note.accidentals ? [...note.accidentals] : note.keys.map(() => null);
          newKeys[ki] = newPitch;
          // Clear accidental for the moved key (new position may differ)
          newAcc[ki] = null;

          // Re-sort low-to-high (VexFlow expects sorted keys), keeping accidentals paired
          const pairs = newKeys.map((k, i) => ({ key: k, acc: newAcc[i], wasDragged: i === ki }));
          pairs.sort((a, b) => pitches.indexOf(b.key) - pitches.indexOf(a.key));
          dragKeyIndexRef.current = pairs.findIndex((p) => p.wasDragged);

          currentNotes = currentNotes.map((n, i) =>
            i === idx
              ? { ...n, keys: pairs.map((p) => p.key), accidentals: pairs.map((p) => p.acc) }
              : n,
          );
          onNotesChange(currentNotes);
        }
      }

      // --- Horizontal: swap with neighbor ---
      if (!swapPendingRef.current) {
        const staveNotes = staveNotesRef.current ?? [];
        if (idx >= 0 && idx < staveNotes.length) {
          try {
            const draggedX = staveNotes[idx].getAbsoluteX();

            // Check left neighbor
            if (idx > 0) {
              const leftX = staveNotes[idx - 1].getAbsoluteX();
              const midpoint = (leftX + draggedX) / 2;
              if (logical.x < midpoint) {
                // Swap with left neighbor
                const swapped = [...notesRef.current];
                [swapped[idx - 1], swapped[idx]] = [swapped[idx], swapped[idx - 1]];
                dragIndexRef.current = idx - 1;
                swapPendingRef.current = true;
                onNotesChange(swapped);
                return;
              }
            }

            // Check right neighbor
            if (idx < staveNotes.length - 1) {
              const rightX = staveNotes[idx + 1].getAbsoluteX();
              const midpoint = (draggedX + rightX) / 2;
              if (logical.x > midpoint) {
                // Swap with right neighbor
                const swapped = [...notesRef.current];
                [swapped[idx], swapped[idx + 1]] = [swapped[idx + 1], swapped[idx]];
                dragIndexRef.current = idx + 1;
                swapPendingRef.current = true;
                onNotesChange(swapped);
                return;
              }
            }
          } catch {
            // getAbsoluteX may throw if note isn't rendered
          }
        }
      }
    },
    [screenToLogical, getClickPitch, onNotesChange, clef, staveNotesRef],
  );

  const handleMouseUp = useCallback(() => {
    dragIndexRef.current = null;
    dragStartRef.current = null;
    dragActivatedRef.current = false;
    currentPitchRef.current = null;
    dragKeyIndexRef.current = 0;
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    dragIndex: dragIndexRef.current,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
