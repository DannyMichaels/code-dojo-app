import { Link } from 'react-router-dom';
import Avatar from '../../../../components/shared/Avatar';
import type { ActivityItem } from '../../../social/types/social.types';
import './ActivityCard.scss';

interface ActivityCardProps {
  activity: ActivityItem;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getActivityText(activity: ActivityItem): string {
  const { type, data } = activity;
  switch (type) {
    case 'skill_started':
      return `started learning ${data.skillName as string}`;
    case 'belt_promotion':
      return `earned ${data.toBelt as string} belt in ${data.skillName as string}`;
    case 'assessment_passed':
      return `passed ${data.belt as string} assessment in ${data.skillName as string}`;
    case 'streak_milestone':
      return `hit a ${data.streakDays as number}-day training streak`;
    default:
      return 'did something';
  }
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const { userId } = activity;

  return (
    <div className="ActivityCard">
      <Link to={`/u/${userId.username}`} className="ActivityCard__avatar">
        <Avatar
          avatar={userId.avatar}
          name={userId.name}
          username={userId.username}
          size="md"
        />
      </Link>
      <div className="ActivityCard__content">
        <p className="ActivityCard__text">
          <Link to={`/u/${userId.username}`} className="ActivityCard__username">
            {userId.name || userId.username}
          </Link>{' '}
          {getActivityText(activity)}
        </p>
        <span className="ActivityCard__time">{formatRelativeTime(activity.createdAt)}</span>
      </div>
    </div>
  );
}
