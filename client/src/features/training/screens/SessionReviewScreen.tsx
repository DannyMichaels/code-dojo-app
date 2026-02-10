import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSession } from '../services/session.service';
import MessageBubble from '../components/MessageBubble';
import Spinner from '../../../components/shared/Spinner';
import type { Session } from '../types/session.types';
import './SessionReviewScreen.scss';

export default function SessionReviewScreen() {
  const { skillId, sessionId } = useParams<{ skillId: string; sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skillId || !sessionId) return;
    async function load() {
      try {
        const s = await getSession(skillId!, sessionId!);
        setSession(s);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [skillId, sessionId]);

  if (loading) {
    return (
      <div className="SessionReviewScreen SessionReviewScreen--loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <div className="SessionReviewScreen">Session not found.</div>;
  }

  return (
    <div className="SessionReviewScreen">
      <div className="SessionReviewScreen__header">
        <h2>Session Review</h2>
        <div className="SessionReviewScreen__meta">
          <span className="SessionReviewScreen__type">{session.type}</span>
          <span className="SessionReviewScreen__date">
            {new Date(session.date).toLocaleDateString()}
          </span>
          <span className={`SessionReviewScreen__status SessionReviewScreen__status--${session.status}`}>
            {session.status}
          </span>
        </div>
      </div>

      {session.evaluation?.correctness && (
        <div className="SessionReviewScreen__evaluation">
          <span>Correctness: <strong>{session.evaluation.correctness}</strong></span>
          <span>Quality: <strong>{session.evaluation.quality}</strong></span>
        </div>
      )}

      {session.observations && session.observations.length > 0 && (
        <div className="SessionReviewScreen__observations">
          <h3>Observations</h3>
          {session.observations.map((obs: any, i: number) => (
            <div key={i} className={`SessionReviewScreen__obs SessionReviewScreen__obs--${obs.severity}`}>
              <span className="SessionReviewScreen__obsType">{obs.type}</span>
              <span className="SessionReviewScreen__obsConcept">{obs.concept}</span>
              <p className="SessionReviewScreen__obsNote">{obs.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="SessionReviewScreen__messages">
        <h3>Conversation</h3>
        {session.messages?.map((msg: any, i: number) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {(!session.messages || session.messages.length === 0) && (
          <p className="SessionReviewScreen__empty">No messages in this session.</p>
        )}
      </div>
    </div>
  );
}
