import api from '../../../api/client';
import type { PublicProfile, PublicSkill } from '../types/profile.types';

export async function getPublicProfile(username: string): Promise<PublicProfile> {
  const res = await api.get(`/users/${username}`);
  return res.data.profile;
}

export async function getPublicSkills(username: string): Promise<PublicSkill[]> {
  const res = await api.get(`/users/${username}/skills`);
  return res.data.skills;
}
