import { useCallback, useRef } from 'react';
import './ResizeHandle.scss';

interface ResizeHandleProps {
  onResize: (leftPercent: number) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export default function ResizeHandle({ onResize, containerRef }: ResizeHandleProps) {
  const dragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((ev.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.min(80, Math.max(20, pct));
        onResize(clamped);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onResize, containerRef],
  );

  return <div className="ResizeHandle" onMouseDown={handleMouseDown} />;
}
