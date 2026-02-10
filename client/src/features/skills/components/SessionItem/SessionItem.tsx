import Card from '../../../../components/shared/Card';
import type { Session } from '../../../training/types/session.types';
import './SessionItem.scss';

interface SessionItemProps {
  session: Session;
  skillId: string;
  onClick: () => void;
  onDelete?: (sessionId: string) => void;
}

export default function SessionItem({ session, onClick, onDelete }: SessionItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(session._id);
  };

  return (
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
            onClick={handleDelete}
            title="Delete session"
          >
            &times;
          </button>
        )}
      </div>
    </Card>
  );
}
