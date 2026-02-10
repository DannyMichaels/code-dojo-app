import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserSkill } from '../services/skill.service';
import { listSessions, deleteSession } from '../../training/services/session.service';
import useSkillStore from '../store/skill.store';
import BeltBadge from '../components/BeltBadge';
import BeltInfoModal from '../components/BeltInfoModal';
import Button from '../../../components/shared/Button';
import StatCard from '../../../components/shared/StatCard';
import Spinner from '../../../components/shared/Spinner';
import Toggle from '../../../components/shared/Toggle';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import ConceptList from '../components/ConceptList';
import SessionList from '../components/SessionList';
import type { UserSkill } from '../types/skill.types';
import type { Session } from '../../training/types/session.types';
import './SkillDetailScreen.scss';

export default function SkillDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { togglePrivacy, removeSkill } = useSkillStore();
  const [skill, setSkill] = useState<UserSkill | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [beltModalOpen, setBeltModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const handleDeleteSession = async (sessionId: string) => {
    if (!skill) return;
    await deleteSession(skill._id, sessionId);
    setSessions(prev => prev.filter(s => s._id !== sessionId));
  };

  const handleTogglePrivacy = async () => {
    if (!skill) return;
    await togglePrivacy(skill._id, !skill.isPublic);
    setSkill(prev => prev ? { ...prev, isPublic: !prev.isPublic } : prev);
  };

  const handleDeleteSkill = async () => {
    if (!skill) return;
    await removeSkill(skill._id);
    navigate('/dashboard');
  };

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
          <button
            className="SkillDetailScreen__beltInfo"
            onClick={() => setBeltModalOpen(true)}
            title="Belt progression info"
          >
            ?
          </button>
        </div>
        <Button onClick={() => navigate(`/train/${skill._id}`)}>
          Start Training
        </Button>
      </div>

      <div className="SkillDetailScreen__privacy">
        <Toggle
          checked={skill.isPublic}
          onChange={handleTogglePrivacy}
          label="Public"
        />
      </div>

      <div className="SkillDetailScreen__stats">
        <StatCard value={conceptCount} label="Concepts" />
        <StatCard value={sessions.length} label="Sessions" />
        <StatCard value={skill.assessmentAvailable ? 'Ready' : 'Not yet'} label="Assessment" />
      </div>

      <ConceptList concepts={skill.concepts} />

      <SessionList
        sessions={sessions}
        skillId={skill._id}
        onSessionClick={(sessionId) => navigate(`/train/${skill._id}/${sessionId}`)}
        onDelete={handleDeleteSession}
      />

      <div className="SkillDetailScreen__danger">
        <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
          Delete Skill
        </Button>
      </div>

      <BeltInfoModal
        open={beltModalOpen}
        onClose={() => setBeltModalOpen(false)}
        skillId={skill._id}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Skill"
        message="This will permanently delete this skill and all associated sessions, belt history, and progress. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteSkill}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
