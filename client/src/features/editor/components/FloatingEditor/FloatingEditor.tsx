import { useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './FloatingEditor.scss';

interface FloatingEditorProps {
  onDock: () => void;
  children: ReactNode;
}

type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export default function FloatingEditor({ onDock, children }: FloatingEditorProps) {
  const [pos, setPos] = useState({ top: 80, left: window.innerWidth - 660 });
  const [size, setSize] = useState({ width: 640, height: 480 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    offset.current = { x: e.clientX - pos.left, y: e.clientY - pos.top };
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        top: Math.max(0, ev.clientY - offset.current.y),
        left: Math.max(0, ev.clientX - offset.current.x),
      });
    };

    const handleUp = () => {
      dragging.current = false;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [pos]);

  const handleEdgeResize = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;
    const startTop = pos.top;
    const startLeft = pos.left;
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let newW = startW;
      let newH = startH;
      let newTop = startTop;
      let newLeft = startLeft;

      if (edge.includes('e')) newW = Math.max(MIN_WIDTH, startW + dx);
      if (edge.includes('s')) newH = Math.max(MIN_HEIGHT, startH + dy);
      if (edge.includes('w')) {
        newW = Math.max(MIN_WIDTH, startW - dx);
        if (newW > MIN_WIDTH) newLeft = startLeft + dx;
      }
      if (edge.includes('n')) {
        newH = Math.max(MIN_HEIGHT, startH - dy);
        if (newH > MIN_HEIGHT) newTop = Math.max(0, startTop + dy);
      }

      setSize({ width: newW, height: newH });
      setPos({ top: newTop, left: newLeft });
    };

    const handleUp = () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [size, pos]);

  return createPortal(
    <div
      className="FloatingEditor"
      style={{
        top: pos.top,
        left: pos.left,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Edge resize handles */}
      <div className="FloatingEditor__edge FloatingEditor__edge--n" onMouseDown={(e) => handleEdgeResize(e, 'n')} />
      <div className="FloatingEditor__edge FloatingEditor__edge--s" onMouseDown={(e) => handleEdgeResize(e, 's')} />
      <div className="FloatingEditor__edge FloatingEditor__edge--e" onMouseDown={(e) => handleEdgeResize(e, 'e')} />
      <div className="FloatingEditor__edge FloatingEditor__edge--w" onMouseDown={(e) => handleEdgeResize(e, 'w')} />
      {/* Corner resize handles */}
      <div className="FloatingEditor__corner FloatingEditor__corner--nw" onMouseDown={(e) => handleEdgeResize(e, 'nw')} />
      <div className="FloatingEditor__corner FloatingEditor__corner--ne" onMouseDown={(e) => handleEdgeResize(e, 'ne')} />
      <div className="FloatingEditor__corner FloatingEditor__corner--sw" onMouseDown={(e) => handleEdgeResize(e, 'sw')} />
      <div className="FloatingEditor__corner FloatingEditor__corner--se" onMouseDown={(e) => handleEdgeResize(e, 'se')} />

      <div className="FloatingEditor__titlebar" onMouseDown={handleTitleMouseDown}>
        <span className="FloatingEditor__title">Code Editor</span>
        <button className="FloatingEditor__dock" onClick={onDock}>
          Dock
        </button>
      </div>
      <div className="FloatingEditor__content">
        {children}
      </div>
    </div>,
    document.body,
  );
}
