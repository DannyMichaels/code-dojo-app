import { useCallback, useEffect, useRef, useState } from 'react';
import type { StaveNote, Stave } from 'vexflow';
import type { NoteData } from './MusicStaffEditor';
import { getPitchesForClef } from '../../utils/pitchUtils';
import { getNoteIndexAtPoint } from '../../utils/noteHitDetection';

export interface UseDragDropReturn {
  isDragging: boolean;
  ghostPosition: { x: number; y: number } | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
}

export function useDragDrop(
  notes: NoteData[],
  clef: string,
  onNotesChange: (notes: NoteData[]) => void,
  staveNotesRef: React.RefObject<StaveNote[]>,
  staveRef: React.RefObject<Stave | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
): UseDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number } | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  // Clean up dragging state if mouse leaves the window
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseUp = () => {
      setIsDragging(false);
      setGhostPosition(null);
      dragIndexRef.current = null;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hitIdx = getNoteIndexAtPoint(x, y, staveNotesRef.current ?? []);
      if (hitIdx >= 0) {
        dragIndexRef.current = hitIdx;
        setIsDragging(true);
        setGhostPosition({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }
    },
    [staveNotesRef, containerRef],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setGhostPosition({ x: e.clientX, y: e.clientY });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || dragIndexRef.current === null) return;

      const container = containerRef.current;
      const stave = staveRef.current;
      if (!container || !stave) {
        setIsDragging(false);
        setGhostPosition(null);
        dragIndexRef.current = null;
        return;
      }

      const rect = container.getBoundingClientRect();
      const dropY = e.clientY - rect.top;

      // Map Y to pitch
      const topLineY = stave.getYForLine(0);
      const bottomLineY = stave.getYForLine(4);
      const lineSpacing = (bottomLineY - topLineY) / 4;
      const halfSpace = lineSpacing / 2;

      const pitches = getPitchesForClef(clef);
      const referenceY = topLineY - halfSpace;
      const pitchIndex = Math.round((dropY - referenceY) / halfSpace);
      const clampedIndex = Math.max(0, Math.min(pitchIndex, pitches.length - 1));
      const newPitch = pitches[clampedIndex];

      // Map X to insertion position
      const dropX = e.clientX - rect.left;
      const currentStaveNotes = staveNotesRef.current ?? [];
      let newPosition = dragIndexRef.current;

      if (currentStaveNotes.length > 0) {
        // Find closest stave note position
        let closestDist = Infinity;
        for (let i = 0; i < currentStaveNotes.length; i++) {
          try {
            const noteX = currentStaveNotes[i].getAbsoluteX();
            const dist = Math.abs(dropX - noteX);
            if (dist < closestDist) {
              closestDist = dist;
              newPosition = i;
            }
          } catch {
            // getAbsoluteX may not be available
          }
        }
      }

      const dragIdx = dragIndexRef.current;
      const updated = [...notes];
      const [moved] = updated.splice(dragIdx, 1);
      moved.keys = [newPitch];

      // Adjust insertion position if dragging from earlier in the array
      const insertAt = dragIdx < newPosition ? newPosition : newPosition;
      updated.splice(insertAt, 0, moved);
      onNotesChange(updated);

      setIsDragging(false);
      setGhostPosition(null);
      dragIndexRef.current = null;
    },
    [isDragging, notes, clef, onNotesChange, staveNotesRef, staveRef, containerRef],
  );

  return { isDragging, ghostPosition, handleMouseDown, handleMouseMove, handleMouseUp };
}
