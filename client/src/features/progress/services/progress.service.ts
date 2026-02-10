import api from '../../../api/client';
import type { DashboardProgress, SkillProgress, BeltInfo } from '../types/progress.types';

export async function getDashboardProgress(): Promise<DashboardProgress> {
  const res = await api.get('/progress');
  return res.data.progress;
}

export async function getSkillProgress(skillId: string): Promise<SkillProgress> {
  const res = await api.get(`/progress/${skillId}`);
  return res.data.progress;
}

export async function getBeltInfo(skillId: string): Promise<BeltInfo> {
  const res = await api.get(`/progress/${skillId}/belt-info`);
  return res.data.beltInfo;
}
