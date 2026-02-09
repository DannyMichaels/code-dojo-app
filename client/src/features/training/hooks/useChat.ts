import { useState, useCallback, useRef } from 'react';
import type { SessionMessage } from '../types/session.types';
import { sendMessageSSE } from '../services/session.service';

interface UseChatOptions {
  skillId: string;
  sessionId: string;
  initialMessages?: SessionMessage[];
}

export default function useChat({ skillId, sessionId, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState<SessionMessage[]>(initialMessages);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback((content: string) => {
    if (streaming) return;
    setError(null);

    // Add user message
    const userMsg: SessionMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Start streaming assistant response
    setStreaming(true);
    let assistantContent = '';

    // Add placeholder assistant message
    const assistantMsg: SessionMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, assistantMsg]);

    abortRef.current = sendMessageSSE(
      skillId,
      sessionId,
      content,
      (text) => {
        assistantContent += text;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
          return updated;
        });
      },
      (_tool, _input) => {
        // Tool use events — for now just note them in the stream
      },
      () => {
        setStreaming(false);
      },
      (err) => {
        setError(err);
        setStreaming(false);
      },
    );
  }, [skillId, sessionId, streaming]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { messages, streaming, error, sendMessage, abort, setMessages };
}
