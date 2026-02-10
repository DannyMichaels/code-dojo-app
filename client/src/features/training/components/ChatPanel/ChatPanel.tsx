import { useEffect, useRef } from 'react';
import MessageBubble from '../MessageBubble';
import ChatInput from '../ChatInput';
import Spinner from '../../../../components/shared/Spinner';
import type { SessionMessage } from '../../types/session.types';
import './ChatPanel.scss';

interface ChatPanelProps {
  messages: SessionMessage[];
  streaming: boolean;
  error: string | null;
  onSend: (content: string) => void;
}

export default function ChatPanel({ messages, streaming, error, onSend }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="ChatPanel">
      <div className="ChatPanel__messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="ChatPanel__empty">
            Start your training session by sending a message.
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {streaming && (
          <div className="ChatPanel__streaming">
            <Spinner size="sm" />
          </div>
        )}
        {error && (
          <div className="ChatPanel__error">{error}</div>
        )}
      </div>
      <ChatInput onSend={onSend} disabled={streaming} />
    </div>
  );
}
