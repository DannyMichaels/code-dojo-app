import { useRef, useState, type ReactNode } from 'react';
import './Tooltip.scss';

interface TooltipProps {
  label: string;
  children: ReactNode;
  position?: 'right' | 'top' | 'bottom';
  disabled?: boolean;
}

export default function Tooltip({ label, children, position = 'right', disabled }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [visible, setVisible] = useState(false);

  if (disabled) return <>{children}</>;

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    if (position === 'right') {
      setStyle({ top: rect.top + rect.height / 2, left: rect.right + 8, transform: 'translateY(-50%)' });
    } else if (position === 'top') {
      setStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' });
    } else {
      setStyle({ top: rect.bottom + 4, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' });
    }
    setVisible(true);
  };

  return (
    <div
      className="Tooltip"
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span className={`Tooltip__label ${visible ? 'Tooltip__label--visible' : ''}`} style={style}>
        {label}
      </span>
    </div>
  );
}
