import { useCallback } from 'react';
import type { ContextMenuItem } from '../../../../components/shared/ContextMenu';
import type { NoteData } from '../MusicStaffEditor';
import { shiftPitch } from '../../utils/pitchUtils';
import { getBaseDuration, toggleDotted } from '../../utils/durationUtils';

const DURATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'w', label: 'Whole' },
  { value: 'h', label: 'Half' },
  { value: 'q', label: 'Quarter' },
  { value: '8', label: 'Eighth' },
  { value: '16', label: 'Sixteenth' },
];

export function useNoteContextMenu(
  notes: NoteData[],
  clef: string,
  onNotesChange: (notes: NoteData[]) => void,
) {
  const buildItems = useCallback(
    (noteIndex: number): ContextMenuItem[] => {
      const note = notes[noteIndex];
      if (!note) return [];

      const updateNote = (patch: Partial<NoteData>) => {
        const updated = notes.map((n, i) => (i === noteIndex ? { ...n, ...patch } : n));
        onNotesChange(updated);
      };

      const currentAcc = note.accidentals?.[0] ?? null;
      const baseDur = getBaseDuration(note.duration);

      return [
        {
          label: 'Delete',
          danger: true,
          onClick: () => onNotesChange(notes.filter((_, i) => i !== noteIndex)),
        },
        {
          label: 'Duration',
          children: DURATION_OPTIONS.map((d) => ({
            label: d.label,
            checked: baseDur === d.value,
            onClick: () => {
              const dur = note.dotted ? d.value + 'd' : d.value;
              updateNote({ duration: dur });
            },
          })),
        },
        {
          label: 'Move Up',
          onClick: () => {
            const newPitch = shiftPitch(note.keys[0], 'up', clef);
            updateNote({ keys: [newPitch] });
          },
        },
        {
          label: 'Move Down',
          onClick: () => {
            const newPitch = shiftPitch(note.keys[0], 'down', clef);
            updateNote({ keys: [newPitch] });
          },
        },
        {
          label: 'Sharp',
          checked: currentAcc === '#',
          onClick: () => {
            updateNote({
              accidentals: [currentAcc === '#' ? null : '#'],
            });
          },
        },
        {
          label: 'Flat',
          checked: currentAcc === 'b',
          onClick: () => {
            updateNote({
              accidentals: [currentAcc === 'b' ? null : 'b'],
            });
          },
        },
        {
          label: 'Natural',
          checked: currentAcc === 'n',
          onClick: () => {
            updateNote({
              accidentals: [currentAcc === 'n' ? null : 'n'],
            });
          },
        },
        {
          label: 'Dotted',
          checked: !!note.dotted,
          onClick: () => {
            updateNote({
              duration: toggleDotted(note.duration),
              dotted: !note.dotted,
            });
          },
        },
        {
          label: 'Tie',
          checked: !!note.tied,
          disabled: noteIndex >= notes.length - 1,
          onClick: () => {
            updateNote({ tied: !note.tied });
          },
        },
      ];
    },
    [notes, clef, onNotesChange],
  );

  return { buildItems };
}
