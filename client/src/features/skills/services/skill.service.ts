import api from '../../../api/client';
import type { UserSkill, SkillCatalogEntry, NormalizeResult } from '../types/skill.types';

export async function listCatalog(q?: string): Promise<SkillCatalogEntry[]> {
  const res = await api.get('/skills/catalog', { params: q ? { q } : {} });
  return res.data.skills;
}

export async function searchCatalog(query: string): Promise<NormalizeResult> {
  const res = await api.post('/skills/catalog/search', { query });
  return res.data;
}

export async function listUserSkills(): Promise<UserSkill[]> {
  const res = await api.get('/user-skills');
  return res.data.skills;
}

export async function startSkill(query: string): Promise<{ skill: UserSkill; onboardingSessionId: string }> {
  const res = await api.post('/user-skills', { query });
  return { skill: res.data.skill, onboardingSessionId: res.data.onboardingSessionId };
}

export async function getUserSkill(id: string): Promise<UserSkill> {
  const res = await api.get(`/user-skills/${id}`);
  return res.data.skill;
}

export async function updatePrivacy(id: string, isPublic: boolean): Promise<UserSkill> {
  const res = await api.put(`/user-skills/${id}/privacy`, { isPublic });
  return res.data.skill;
}

export async function deleteUserSkill(id: string): Promise<void> {
  await api.delete(`/user-skills/${id}`);
}
