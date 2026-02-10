import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../../../components/shared/Avatar';
import Button from '../../../../components/shared/Button';
import type { FollowUser } from '../../../social/types/social.types';
import * as socialService from '../../../social/services/social.service';
import './FollowListModal.scss';

interface FollowListModalProps {
  open: boolean;
  userId: string;
  mode: 'followers' | 'following';
  onClose: () => void;
}

export default function FollowListModal({ open, userId, mode, onClose }: FollowListModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUsers([]);
    setPage(1);
    load(1);
  }, [open, userId, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async (p: number) => {
    setLoading(true);
    try {
      const data = mode === 'followers'
        ? await socialService.getFollowers(userId, p)
        : await socialService.getFollowing(userId, p);
      const list = (mode === 'followers' ? data.followers : data.following) || [];
      setUsers(prev => p === 1 ? list : [...prev, ...list]);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="FollowListModal__overlay" onClick={onClose}>
      <div className="FollowListModal" onClick={(e) => e.stopPropagation()}>
        <div className="FollowListModal__header">
          <h3>{mode === 'followers' ? 'Followers' : 'Following'}</h3>
          <button className="FollowListModal__close" onClick={onClose}>&times;</button>
        </div>
        <div className="FollowListModal__list">
          {users.map((u) => (
            <Link
              key={u._id}
              to={`/u/${u.username}`}
              className="FollowListModal__item"
              onClick={onClose}
            >
              <Avatar avatar={u.avatar} name={u.name} username={u.username} size="sm" />
              <div className="FollowListModal__info">
                <span className="FollowListModal__name">{u.name || u.username}</span>
                <span className="FollowListModal__username">@{u.username}</span>
              </div>
            </Link>
          ))}
          {users.length === 0 && !loading && (
            <p className="FollowListModal__empty">
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          )}
          {page < totalPages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => load(page + 1)}
              loading={loading}
              fullWidth
            >
              Load More
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
