import ProgressBar from '../../../../components/shared/ProgressBar';
import './ConceptItem.scss';

interface ConceptItemProps {
  name: string;
  mastery: number; // 0-1
  streak: number;
  contexts: string[];
}

export default function ConceptItem({ name, mastery }: ConceptItemProps) {
  const pct = Math.round((mastery || 0) * 100);

  return (
    <div className="ConceptItem">
      <div className="ConceptItem__header">
        <span className="ConceptItem__name">{name.replace(/_/g, ' ')}</span>
        <span className="ConceptItem__mastery">{pct}%</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}
