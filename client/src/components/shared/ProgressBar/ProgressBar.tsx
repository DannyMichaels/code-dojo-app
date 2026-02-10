import './ProgressBar.scss';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export default function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={`ProgressBar ${className || ''}`}>
      <div
        className="ProgressBar__fill"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
