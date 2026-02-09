import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';
import useChat from '../hooks/useChat';
import { createSession, getSession } from '../services/session.service';
import { getUserSkill } from '../../skills/services/skill.service';
import Spinner from '../../../components/shared/Spinner';
import type { Session } from '../types/session.types';
import type { UserSkill } from '../../skills/types/skill.types';
import './TrainingScreen.scss';

export default function TrainingScreen() {
  const { skillId, sessionId } = useParams<{ skillId: string; sessionId?: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [skill, setSkill] = useState<UserSkill | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!skillId) return;

    async function init() {
      try {
        setLoading(true);
        const skillData = await getUserSkill(skillId!);
        setSkill(skillData);

        let sess: Session;
        if (sessionId) {
          sess = await getSession(skillId!, sessionId);
        } else {
          // Create a new training session
          sess = await createSession(skillId!, 'training');
          navigate(`/train/${skillId}/${sess._id}`, { replace: true });
        }
        setSession(sess);
      } catch (err: any) {
        setInitError(err.response?.data?.error || 'Failed to initialize session');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [skillId, sessionId, navigate]);

  const chat = useChat({
    skillId: skillId || '',
    sessionId: session?._id || '',
    initialMessages: session?.messages || [],
  });

  // Update chat messages when session loads
  useEffect(() => {
    if (session?.messages?.length) {
      chat.setMessages(session.messages);
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="TrainingScreen TrainingScreen--loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="TrainingScreen TrainingScreen--error">
        <p>{initError}</p>
      </div>
    );
  }

  return (
    <div className="TrainingScreen">
      <div className="TrainingScreen__header">
        <h2>{skill?.skillCatalogId?.name || 'Training'}</h2>
        <span className="TrainingScreen__type">{session?.type}</span>
      </div>
      <div className="TrainingScreen__chat">
        <ChatPanel
          messages={chat.messages}
          streaming={chat.streaming}
          error={chat.error}
          onSend={chat.sendMessage}
        />
      </div>
    </div>
  );
}
