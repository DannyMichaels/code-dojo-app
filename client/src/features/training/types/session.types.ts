export type SessionType = 'training' | 'assessment' | 'onboarding' | 'kata';
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface SessionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Session {
  _id: string;
  skillId: string;
  userId: string;
  date: string;
  type: SessionType;
  status: SessionStatus;
  messages: SessionMessage[];
  problem: {
    prompt: string;
    conceptsTargeted: string[];
    beltLevel: string;
    starterCode?: string;
  };
  solution: {
    submitted: boolean;
    passed: boolean | null;
    code: string;
    language: string;
  };
  evaluation: {
    correctness: string | null;
    quality: string | null;
  };
  observations: Array<{
    type: string;
    concept: string;
    note: string;
    severity: string;
  }>;
}

export interface SSEEvent {
  type: 'text' | 'tool_use' | 'done' | 'error';
  content?: string;
  tool?: string;
  input?: Record<string, unknown>;
  error?: string;
}
