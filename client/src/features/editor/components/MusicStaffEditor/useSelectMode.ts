import { useCallback, useEffect, useState } from 'react';
import type { NoteData } from './MusicStaffEditor';
import { shiftPitch } from '../../utils/pitchUtils';

export interface UseSelectModeReturn {
  selectedNoteIndex: number | null;
  setSelectedNoteIndex: (i: number | null) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

export function useSelectMode(
  notes: NoteData[],
  clef: string,
  onNotesChange: (notes: NoteData[]) => void,
  containerRef: React.RefObject<HTMLDivElement | null>,
): UseSelectModeReturn {
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);

  // Clear selection if notes change and index is out of bounds
  useEffect(() => {
    if (selectedNoteIndex !== null && selectedNoteIndex >= notes.length) {
      setSelectedNoteIndex(null);
    }
  }, [notes.length, selectedNoteIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedNoteIndex === null) return;

      const note = notes[selectedNoteIndex];
      if (!note) return;

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          const newPitch = shiftPitch(note.keys[0], 'up', clef);
          const updated = notes.map((n, i) =>
            i === selectedNoteIndex ? { ...n, keys: [newPitch] } : n,
          );
          onNotesChange(updated);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const newPitch = shiftPitch(note.keys[0], 'down', clef);
          const updated = notes.map((n, i) =>
            i === selectedNoteIndex ? { ...n, keys: [newPitch] } : n,
          );
          onNotesChange(updated);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (selectedNoteIndex > 0) {
            const updated = [...notes];
            [updated[selectedNoteIndex - 1], updated[selectedNoteIndex]] = [
              updated[selectedNoteIndex],
              updated[selectedNoteIndex - 1],
            ];
            onNotesChange(updated);
            setSelectedNoteIndex(selectedNoteIndex - 1);
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (selectedNoteIndex < notes.length - 1) {
            const updated = [...notes];
            [updated[selectedNoteIndex], updated[selectedNoteIndex + 1]] = [
              updated[selectedNoteIndex + 1],
              updated[selectedNoteIndex],
            ];
            onNotesChange(updated);
            setSelectedNoteIndex(selectedNoteIndex + 1);
          }
          break;
        }
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          const updated = notes.filter((_, i) => i !== selectedNoteIndex);
          onNotesChange(updated);
          setSelectedNoteIndex(null);
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setSelectedNoteIndex(null);
          break;
        }
      }
    },
    [selectedNoteIndex, notes, clef, onNotesChange],
  );

  // Register keydown listener on container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, handleKeyDown]);

  return { selectedNoteIndex, setSelectedNoteIndex, handleKeyDown };
}
