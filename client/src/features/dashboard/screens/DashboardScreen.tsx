import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../auth/store/auth.store';
import useSkillStore from '../../skills/store/skill.store';
import SkillCard from '../../skills/components/SkillCard';
import AddSkillDialog from '../../skills/components/AddSkillDialog';
import Button from '../../../components/shared/Button';
import Spinner from '../../../components/shared/Spinner';
import './DashboardScreen.scss';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { skills, loading, fetchSkills } = useSkillStore();
  const [showAddSkill, setShowAddSkill] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return (
    <div className="DashboardScreen">
      <div className="DashboardScreen__header">
        <h1 className="DashboardScreen__title">
          Welcome, {user?.name || user?.username || 'Student'}
        </h1>
        <Button onClick={() => setShowAddSkill(true)}>New Skill</Button>
      </div>
      <p className="DashboardScreen__subtitle">
        Your training skills will appear here. Start by adding a new skill.
      </p>

      {loading ? (
        <div className="DashboardScreen__loading">
          <Spinner size="md" />
        </div>
      ) : skills.length === 0 ? (
        <div className="DashboardScreen__empty">
          No skills yet. Start training to begin your journey.
        </div>
      ) : (
        <div className="DashboardScreen__grid">
          {skills.map(skill => (
            <SkillCard key={skill._id} skill={skill} />
          ))}
        </div>
      )}

      <AddSkillDialog
        open={showAddSkill}
        onClose={() => setShowAddSkill(false)}
        onAdded={(skillId, onboardingSessionId) => {
          setShowAddSkill(false);
          navigate(`/train/${skillId}/${onboardingSessionId}`);
        }}
      />
    </div>
  );
}
