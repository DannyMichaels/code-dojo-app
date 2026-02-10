import { useCallback, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './FloatingEditor.scss';

interface FloatingEditorProps {
  onDock: () => void;
  children: ReactNode;
}

export default function FloatingEditor({ onDock, children }: FloatingEditorProps) {
  const [pos, setPos] = useState({ top: 80, left: window.innerWidth - 660 });
  const [size, setSize] = useState({ width: 640, height: 480 });
  const dragging = useRef(false);
  const resizing = useRef(false);
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

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      setSize({
        width: Math.max(320, startW + (ev.clientX - startX)),
        height: Math.max(240, startH + (ev.clientY - startY)),
      });
    };

    const handleUp = () => {
      resizing.current = false;
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [size]);

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
      <div className="FloatingEditor__titlebar" onMouseDown={handleTitleMouseDown}>
        <span className="FloatingEditor__title">Code Editor</span>
        <button className="FloatingEditor__dock" onClick={onDock}>
          Dock
        </button>
      </div>
      <div className="FloatingEditor__content">
        {children}
      </div>
      <div className="FloatingEditor__resize" onMouseDown={handleResizeMouseDown} />
    </div>,
    document.body,
  );
}
