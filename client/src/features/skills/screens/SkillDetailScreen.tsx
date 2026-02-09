import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserSkill } from '../services/skill.service';
import { listSessions } from '../../training/services/session.service';
import BeltBadge from '../components/BeltBadge';
import Button from '../../../components/shared/Button';
import Card from '../../../components/shared/Card';
import Spinner from '../../../components/shared/Spinner';
import type { UserSkill } from '../types/skill.types';
import type { Session } from '../../training/types/session.types';
import './SkillDetailScreen.scss';

export default function SkillDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<UserSkill | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [s, sess] = await Promise.all([
          getUserSkill(id!),
          listSessions(id!),
        ]);
        setSkill(s);
        setSessions(sess);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="SkillDetailScreen SkillDetailScreen--loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!skill) {
    return <div className="SkillDetailScreen">Skill not found.</div>;
  }

  const catalog = skill.skillCatalogId;
  const conceptCount = skill.concepts ? Object.keys(skill.concepts).length : 0;

  return (
    <div className="SkillDetailScreen">
      <div className="SkillDetailScreen__header">
        <div>
          <h1>{catalog.name}</h1>
          <BeltBadge belt={skill.currentBelt} size="lg" />
        </div>
        <Button onClick={() => navigate(`/train/${skill._id}`)}>
          Start Training
        </Button>
      </div>

      <div className="SkillDetailScreen__stats">
        <Card>
          <div className="SkillDetailScreen__stat">
            <span className="SkillDetailScreen__statValue">{conceptCount}</span>
            <span className="SkillDetailScreen__statLabel">Concepts</span>
          </div>
        </Card>
        <Card>
          <div className="SkillDetailScreen__stat">
            <span className="SkillDetailScreen__statValue">{sessions.length}</span>
            <span className="SkillDetailScreen__statLabel">Sessions</span>
          </div>
        </Card>
        <Card>
          <div className="SkillDetailScreen__stat">
            <span className="SkillDetailScreen__statValue">
              {skill.assessmentAvailable ? 'Ready' : 'Not yet'}
            </span>
            <span className="SkillDetailScreen__statLabel">Assessment</span>
          </div>
        </Card>
      </div>

      <h3>Recent Sessions</h3>
      {sessions.length === 0 ? (
        <p className="SkillDetailScreen__empty">No sessions yet. Start training!</p>
      ) : (
        <div className="SkillDetailScreen__sessions">
          {sessions.map(sess => (
            <Card
              key={sess._id}
              hoverable
              onClick={() => navigate(`/train/${skill._id}/${sess._id}`)}
            >
              <div className="SkillDetailScreen__session">
                <span>{sess.type}</span>
                <span className="SkillDetailScreen__sessionDate">
                  {new Date(sess.date).toLocaleDateString()}
                </span>
                <span className={`SkillDetailScreen__sessionStatus SkillDetailScreen__sessionStatus--${sess.status}`}>
                  {sess.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
