import { useState } from 'react';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import useSkillStore from '../store/skill.store';
import './AddSkillDialog.scss';

interface AddSkillDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: (skillId: string) => void;
}

export default function AddSkillDialog({ open, onClose, onAdded }: AddSkillDialogProps) {
  const [query, setQuery] = useState('');
  const { addSkill, loading, error, clearError } = useSkillStore();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const skill = await addSkill(query.trim());
      setQuery('');
      onAdded(skill._id);
    } catch {
      // error handled by store
    }
  };

  const handleClose = () => {
    setQuery('');
    clearError();
    onClose();
  };

  return (
    <div className="AddSkillDialog__overlay" onClick={handleClose}>
      <div className="AddSkillDialog" onClick={e => e.stopPropagation()}>
        <h3 className="AddSkillDialog__title">Start a New Skill</h3>
        <p className="AddSkillDialog__desc">
          What would you like to learn? Type a language, framework, or technology.
        </p>
        {error && <div className="AddSkillDialog__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <Input
            name="query"
            placeholder='e.g. "Python", "React", "SQL"'
            value={query}
            onChange={e => { setQuery(e.target.value); clearError(); }}
            autoFocus
          />
          <div className="AddSkillDialog__actions">
            <Button variant="ghost" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!query.trim()}>
              Start Training
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
