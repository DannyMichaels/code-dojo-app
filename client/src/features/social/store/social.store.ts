import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ActivityItem, SearchUser } from '../types/social.types';
import * as socialService from '../services/social.service';

interface SocialStore {
  followingFeed: ActivityItem[];
  forYouFeed: ActivityItem[];
  followingPage: number;
  followingTotalPages: number;
  forYouPage: number;
  forYouTotalPages: number;
  searchResults: SearchUser[];
  loading: boolean;
  searchLoading: boolean;

  fetchFollowingFeed: (page?: number) => Promise<void>;
  fetchForYouFeed: (page?: number) => Promise<void>;
  searchUsers: (q: string) => Promise<void>;
  clearSearch: () => void;
}

const useSocialStore = create<SocialStore>()(
  devtools((set, get) => ({
    followingFeed: [],
    forYouFeed: [],
    followingPage: 1,
    followingTotalPages: 0,
    forYouPage: 1,
    forYouTotalPages: 0,
    searchResults: [],
    loading: false,
    searchLoading: false,

    fetchFollowingFeed: async (page = 1) => {
      set({ loading: true });
      try {
        const data = await socialService.getFollowingFeed(page);
        set({
          followingFeed: page === 1 ? data.activities : [...get().followingFeed, ...data.activities],
          followingPage: data.page,
          followingTotalPages: data.totalPages,
          loading: false,
        });
      } catch {
        set({ loading: false });
      }
    },

    fetchForYouFeed: async (page = 1) => {
      set({ loading: true });
      try {
        const data = await socialService.getForYouFeed(page);
        set({
          forYouFeed: page === 1 ? data.activities : [...get().forYouFeed, ...data.activities],
          forYouPage: data.page,
          forYouTotalPages: data.totalPages,
          loading: false,
        });
      } catch {
        set({ loading: false });
      }
    },

    searchUsers: async (q: string) => {
      set({ searchLoading: true });
      try {
        const users = await socialService.searchUsers(q);
        set({ searchResults: users, searchLoading: false });
      } catch {
        set({ searchResults: [], searchLoading: false });
      }
    },

    clearSearch: () => set({ searchResults: [] }),
  })),
);

export default useSocialStore;
