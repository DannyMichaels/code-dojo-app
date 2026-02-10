import { useState } from 'react';
import Card from '../../../../components/shared/Card';
import ConfirmDialog from '../../../../components/shared/ConfirmDialog';
import type { Session } from '../../../training/types/session.types';
import './SessionItem.scss';

interface SessionItemProps {
  session: Session;
  skillId: string;
  onClick: () => void;
  onDelete?: (sessionId: string) => void;
}

export default function SessionItem({ session, onClick, onDelete }: SessionItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmHide = () => {
    setConfirmOpen(false);
    onDelete?.(session._id);
  };

  return (
    <>
      <Card hoverable onClick={onClick}>
        <div className="SessionItem">
          <span>{session.type}</span>
          <span className="SessionItem__date">
            {new Date(session.date).toLocaleDateString()}
          </span>
          <span className={`SessionItem__status SessionItem__status--${session.status}`}>
            {session.status}
          </span>
          {onDelete && (
            <button
              className="SessionItem__delete"
              onClick={handleHideClick}
              title="Hide session"
            >
              &times;
            </button>
          )}
        </div>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        title="Hide Session"
        message="This session will be hidden from your history. This cannot be undone."
        confirmLabel="Hide"
        variant="danger"
        onConfirm={handleConfirmHide}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
