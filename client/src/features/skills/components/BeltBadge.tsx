import type { Belt } from '../types/skill.types';
import './BeltBadge.scss';

const BELT_COLORS: Record<Belt, string> = {
  white: '#f0f0f0',
  yellow: '#ffd700',
  orange: '#ff8c00',
  green: '#2ecc71',
  blue: '#3498db',
  purple: '#9b59b6',
  brown: '#8b4513',
  black: '#1a1a2e',
};

interface BeltBadgeProps {
  belt: Belt;
  size?: 'sm' | 'md' | 'lg';
}

export default function BeltBadge({ belt, size = 'md' }: BeltBadgeProps) {
  return (
    <span
      className={`BeltBadge BeltBadge--${size}`}
      style={{ backgroundColor: BELT_COLORS[belt] }}
      title={`${belt.charAt(0).toUpperCase() + belt.slice(1)} Belt`}
    >
      {belt.charAt(0).toUpperCase() + belt.slice(1)}
    </span>
  );
}
