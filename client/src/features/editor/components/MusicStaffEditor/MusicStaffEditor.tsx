import { useCallback, useEffect, useRef } from 'react';
import {
  Renderer,
  Stave,
  StaveNote,
  StaveTie,
  Voice,
  Formatter,
  Accidental,
  Dot,
  type RenderContext,
} from 'vexflow';
import { getPitchesForClef } from '../../utils/pitchUtils';
import { getNoteIndexAtPoint, applyNoteIndexAttributes } from '../../utils/noteHitDetection';
import './MusicStaffEditor.scss';

export type InteractionMode = 'place' | 'select';

export interface NoteData {
  keys: string[];
  duration: string;
  accidentals?: (string | null)[];
  dotted?: boolean;
  tied?: boolean;
}

interface MusicStaffEditorProps {
  notes: NoteData[];
  clef: 'treble' | 'bass' | 'alto';
  timeSignature: string;
  keySignature: string;
  selectedDuration: string;
  onNotesChange: (notes: NoteData[]) => void;
  readOnly?: boolean;
  mode?: InteractionMode;
  highlightedNoteIndex?: number | null;
  selectedNoteIndex?: number | null;
  onNoteSelect?: (index: number | null) => void;
  onNoteContextMenu?: (e: React.MouseEvent, noteIndex: number) => void;
}

function buildVexDuration(note: NoteData): string {
  let dur = note.duration;
  // If dotted flag is set but duration doesn't have 'd', add it
  if (note.dotted && !dur.includes('d')) {
    const isRest = dur.endsWith('r');
    if (isRest) {
      dur = dur.replace('r', 'dr');
    } else {
      dur = dur + 'd';
    }
  }
  return dur;
}

export default function MusicStaffEditor({
  notes,
  clef,
  timeSignature,
  keySignature,
  selectedDuration,
  onNotesChange,
  readOnly = false,
  mode = 'place',
  highlightedNoteIndex,
  selectedNoteIndex,
  onNoteSelect,
  onNoteContextMenu,
}: MusicStaffEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const staveRef = useRef<Stave | null>(null);
  const staveNotesRef = useRef<StaveNote[]>([]);

  // Render the stave and notes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const width = container.clientWidth || 600;
    const height = 200;

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    rendererRef.current = renderer;

    const context: RenderContext = renderer.getContext();

    const stave = new Stave(10, 30, width - 30);
    stave.addClef(clef);
    stave.addTimeSignature(timeSignature);
    if (keySignature && keySignature !== 'C') {
      stave.addKeySignature(keySignature);
    }
    stave.setContext(context).draw();
    staveRef.current = stave;

    if (notes.length > 0) {
      const renderNotes = (numBeats: number, beatValue: number) => {
        const staveNotes = notes.map((n) => {
          const dur = buildVexDuration(n);
          const sn = new StaveNote({ keys: n.keys, duration: dur, clef });

          // Add accidentals
          if (n.accidentals) {
            n.accidentals.forEach((acc, keyIdx) => {
              if (acc) {
                sn.addModifier(new Accidental(acc), keyIdx);
              }
            });
          }

          // Add dots
          if (n.dotted) {
            Dot.buildAndAttach([sn]);
          }

          return sn;
        });

        const voice = new Voice({ numBeats, beatValue }).setStrict(false);
        voice.addTickables(staveNotes);
        new Formatter().joinVoices([voice]).format([voice], width - 80);
        voice.draw(context, stave);

        // Render ties between consecutive tied notes
        for (let i = 0; i < notes.length - 1; i++) {
          if (notes[i].tied) {
            const tie = new StaveTie({
              firstNote: staveNotes[i],
              lastNote: staveNotes[i + 1],
            });
            tie.setContext(context).draw();
          }
        }

        // Store refs and apply data attributes
        staveNotesRef.current = staveNotes;
        applyNoteIndexAttributes(staveNotes);
      };

      try {
        renderNotes(
          parseInt(timeSignature.split('/')[0], 10),
          parseInt(timeSignature.split('/')[1], 10),
        );
      } catch {
        try {
          renderNotes(128, 4);
        } catch {
          staveNotesRef.current = [];
        }
      }
    } else {
      staveNotesRef.current = [];
    }
  }, [notes, clef, timeSignature, keySignature]);

  // Highlight effect — applies/removes CSS classes without re-rendering VexFlow
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear all highlights
    container.querySelectorAll('.MusicStaffEditor__note--playing').forEach((el) => {
      el.classList.remove('MusicStaffEditor__note--playing');
    });

    if (highlightedNoteIndex != null) {
      const el = container.querySelector(`[data-note-index="${highlightedNoteIndex}"]`);
      if (el) el.classList.add('MusicStaffEditor__note--playing');
    }
  }, [highlightedNoteIndex]);

  // Selection highlight
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll('.MusicStaffEditor__note--selected').forEach((el) => {
      el.classList.remove('MusicStaffEditor__note--selected');
    });

    if (selectedNoteIndex != null) {
      const el = container.querySelector(`[data-note-index="${selectedNoteIndex}"]`);
      if (el) el.classList.add('MusicStaffEditor__note--selected');
    }
  }, [selectedNoteIndex]);

  const getClickPitch = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      const stave = staveRef.current;
      if (!container || !stave) return null;

      const rect = container.getBoundingClientRect();
      const clickY = clientY - rect.top;

      const topLineY = stave.getYForLine(0);
      const bottomLineY = stave.getYForLine(4);
      const lineSpacing = (bottomLineY - topLineY) / 4;
      const halfSpace = lineSpacing / 2;

      const pitches = getPitchesForClef(clef);
      const referenceY = topLineY - halfSpace;

      const pitchIndex = Math.round((clickY - referenceY) / halfSpace);
      const clampedIndex = Math.max(0, Math.min(pitchIndex, pitches.length - 1));
      return pitches[clampedIndex];
    },
    [clef],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly) return;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (mode === 'select') {
        const hitIdx = getNoteIndexAtPoint(x, y, staveNotesRef.current);
        onNoteSelect?.(hitIdx >= 0 ? hitIdx : null);
        return;
      }

      // Place mode — existing behavior
      const pitch = getClickPitch(e.clientY);
      if (!pitch) return;

      const existingIndex = notes.findIndex(
        (n) => n.keys.length === 1 && n.keys[0] === pitch,
      );

      if (existingIndex >= 0) {
        const updated = notes.filter((_, i) => i !== existingIndex);
        onNotesChange(updated);
      } else {
        const newNote: NoteData = { keys: [pitch], duration: selectedDuration };
        onNotesChange([...notes, newNote]);
      }
    },
    [notes, clef, selectedDuration, onNotesChange, readOnly, mode, onNoteSelect, getClickPitch],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !onNoteContextMenu) return;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hitIdx = getNoteIndexAtPoint(x, y, staveNotesRef.current);
      if (hitIdx >= 0) {
        e.preventDefault();
        onNoteContextMenu(e, hitIdx);
      }
    },
    [readOnly, onNoteContextMenu],
  );

  const classNames = [
    'MusicStaffEditor',
    readOnly && 'MusicStaffEditor--readOnly',
    mode === 'select' && 'MusicStaffEditor--selectMode',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      ref={containerRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      tabIndex={0}
    />
  );
}
