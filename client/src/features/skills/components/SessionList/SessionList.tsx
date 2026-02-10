import SessionItem from '../SessionItem';
import type { Session } from '../../../training/types/session.types';
import './SessionList.scss';

interface SessionListProps {
  sessions: Session[];
  skillId: string;
  onSessionClick: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
}

export default function SessionList({ sessions, skillId, onSessionClick, onDelete }: SessionListProps) {
  return (
    <>
      <h3>Recent Sessions</h3>
      {sessions.length === 0 ? (
        <p className="SessionList__empty">No sessions yet. Start training!</p>
      ) : (
        <div className="SessionList">
          {sessions.map(sess => (
            <SessionItem
              key={sess._id}
              session={sess}
              skillId={skillId}
              onClick={() => onSessionClick(sess._id)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  );
}
