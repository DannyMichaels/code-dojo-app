import cn from 'classnames';
import './Toggle.scss';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: ToggleProps) {
  return (
    <label className={cn('Toggle', { 'Toggle--disabled': disabled }, className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={cn('Toggle__track', { 'Toggle__track--on': checked })}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="Toggle__thumb" />
      </button>
      {label && <span className="Toggle__label">{label}</span>}
    </label>
  );
}
