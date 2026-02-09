import type { SessionMessage } from '../types/session.types';
import './MessageBubble.scss';

interface MessageBubbleProps {
  message: SessionMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`MessageBubble MessageBubble--${message.role}`}>
      <div className="MessageBubble__label">
        {message.role === 'user' ? 'You' : 'Sensei'}
      </div>
      <div className="MessageBubble__content">
        {message.content}
      </div>
    </div>
  );
}
