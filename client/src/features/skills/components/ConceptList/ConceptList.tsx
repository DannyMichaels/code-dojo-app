import ConceptItem from '../ConceptItem';
import './ConceptList.scss';

interface ConceptListProps {
  concepts: Record<string, { mastery: number; streak: number; contexts: string[] }>;
}

export default function ConceptList({ concepts }: ConceptListProps) {
  const entries = Object.entries(concepts);
  if (entries.length === 0) return null;

  return (
    <>
      <h3>Concept Mastery</h3>
      <div className="ConceptList">
        {entries.map(([name, data]) => (
          <ConceptItem
            key={name}
            name={name}
            mastery={data.mastery}
            streak={data.streak}
            contexts={data.contexts}
          />
        ))}
      </div>
    </>
  );
}
