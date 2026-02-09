import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserSkill } from '../types/skill.types';
import * as skillService from '../services/skill.service';

interface SkillStore {
  skills: UserSkill[];
  loading: boolean;
  error: string | null;
  fetchSkills: () => Promise<void>;
  addSkill: (query: string) => Promise<UserSkill>;
  removeSkill: (id: string) => Promise<void>;
  togglePrivacy: (id: string, isPublic: boolean) => Promise<void>;
  clearError: () => void;
}

const useSkillStore = create<SkillStore>()(
  devtools((set, get) => ({
    skills: [],
    loading: false,
    error: null,

    fetchSkills: async () => {
      set({ loading: true, error: null });
      try {
        const skills = await skillService.listUserSkills();
        set({ skills, loading: false });
      } catch (err: any) {
        set({ loading: false, error: err.response?.data?.error || 'Failed to load skills' });
      }
    },

    addSkill: async (query: string) => {
      set({ loading: true, error: null });
      try {
        const skill = await skillService.startSkill(query);
        set({ skills: [...get().skills, skill], loading: false });
        return skill;
      } catch (err: any) {
        set({ loading: false, error: err.response?.data?.error || 'Failed to add skill' });
        throw err;
      }
    },

    removeSkill: async (id: string) => {
      try {
        await skillService.deleteUserSkill(id);
        set({ skills: get().skills.filter(s => s._id !== id) });
      } catch (err: any) {
        set({ error: err.response?.data?.error || 'Failed to remove skill' });
      }
    },

    togglePrivacy: async (id: string, isPublic: boolean) => {
      try {
        const updated = await skillService.updatePrivacy(id, isPublic);
        set({ skills: get().skills.map(s => s._id === id ? updated : s) });
      } catch (err: any) {
        set({ error: err.response?.data?.error || 'Failed to update privacy' });
      }
    },

    clearError: () => set({ error: null }),
  })),
);

export default useSkillStore;
