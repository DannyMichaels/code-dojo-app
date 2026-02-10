import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProfile, getPublicSkills } from '../services/profile.service';
import BeltBadge from '../../skills/components/BeltBadge';
import Spinner from '../../../components/shared/Spinner';
import type { Belt } from '../../skills/types/skill.types';
import type { PublicProfile, PublicSkill } from '../types/profile.types';
import './PublicProfileScreen.scss';

export default function PublicProfileScreen() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [skills, setSkills] = useState<PublicSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    async function load() {
      try {
        const [p, s] = await Promise.all([
          getPublicProfile(username!),
          getPublicSkills(username!),
        ]);
        setProfile(p);
        setSkills(s);
      } catch {
        setError('User not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="PublicProfileScreen PublicProfileScreen--loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="PublicProfileScreen PublicProfileScreen--error">
        <p>{error || 'User not found'}</p>
      </div>
    );
  }

  const initial = (profile.name || profile.username || '?')[0].toUpperCase();

  return (
    <div className="PublicProfileScreen">
      <div className="PublicProfileScreen__header">
        {profile.avatarUrl ? (
          <img className="PublicProfileScreen__avatar" src={profile.avatarUrl} alt={profile.username} />
        ) : (
          <div className="PublicProfileScreen__avatarFallback">{initial}</div>
        )}
        <div className="PublicProfileScreen__info">
          <h1>{profile.name || profile.username}</h1>
          <span className="PublicProfileScreen__username">@{profile.username}</span>
          {profile.bio && <p className="PublicProfileScreen__bio">{profile.bio}</p>}
          <span className="PublicProfileScreen__joined">
            Joined {new Date(profile.created).toLocaleDateString()}
          </span>
        </div>
      </div>

      <h2 className="PublicProfileScreen__sectionTitle">
        Skills ({skills.length})
      </h2>

      {skills.length === 0 ? (
        <p className="PublicProfileScreen__empty">No public skills yet.</p>
      ) : (
        <div className="PublicProfileScreen__skills">
          {skills.map(skill => (
            <div key={skill._id} className="PublicProfileScreen__skillCard">
              <span className="PublicProfileScreen__skillName">
                {skill.skillCatalogId.name}
              </span>
              <BeltBadge belt={skill.currentBelt as Belt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
