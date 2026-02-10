import cn from 'classnames';
import Button from '../Button';
import './ConfirmDialog.scss';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="ConfirmDialog__overlay" onClick={onCancel}>
      <div
        className={cn('ConfirmDialog', `ConfirmDialog--${variant}`)}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="ConfirmDialog__title">{title}</h3>
        <p className="ConfirmDialog__message">{message}</p>
        <div className="ConfirmDialog__actions">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
