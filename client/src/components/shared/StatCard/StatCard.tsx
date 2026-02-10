import Card from '../Card';
import './StatCard.scss';

interface StatCardProps {
  value: string | number;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <Card>
      <div className="StatCard">
        <span className="StatCard__value">{value}</span>
        <span className="StatCard__label">{label}</span>
      </div>
    </Card>
  );
}
