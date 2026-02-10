import { useState } from 'react';
import cn from 'classnames';
import Button from '../../../../components/shared/Button';
import * as socialService from '../../../social/services/social.service';
import './FollowButton.scss';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onToggle?: (following: boolean) => void;
}

export default function FollowButton({ userId, initialIsFollowing, onToggle }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialIsFollowing);
  const [hover, setHover] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const prev = following;
    setFollowing(!prev);
    onToggle?.(!prev);
    setLoading(true);

    try {
      if (prev) {
        await socialService.unfollowUser(userId);
      } else {
        await socialService.followUser(userId);
      }
    } catch {
      // Revert on error
      setFollowing(prev);
      onToggle?.(prev);
    } finally {
      setLoading(false);
    }
  };

  const label = following
    ? hover ? 'Unfollow' : 'Following'
    : 'Follow';

  return (
    <Button
      className={cn('FollowButton', { 'FollowButton--following': following })}
      variant={following ? 'ghost' : 'primary'}
      size="sm"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      loading={loading}
    >
      {label}
    </Button>
  );
}
