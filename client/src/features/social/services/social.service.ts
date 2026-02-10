import api from '../../../api/client';
import type { FeedResponse, FollowListResponse, SearchUser } from '../types/social.types';

export async function followUser(userId: string): Promise<void> {
  await api.post('/social/follow', { userId });
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/social/follow/${userId}`);
}

export async function getFollowers(userId: string, page = 1): Promise<FollowListResponse> {
  const res = await api.get(`/social/followers/${userId}?page=${page}`);
  return res.data;
}

export async function getFollowing(userId: string, page = 1): Promise<FollowListResponse> {
  const res = await api.get(`/social/following/${userId}?page=${page}`);
  return res.data;
}

export async function isFollowing(userId: string): Promise<boolean> {
  const res = await api.get(`/social/is-following/${userId}`);
  return res.data.isFollowing;
}

export async function getFollowCounts(userId: string): Promise<{ followerCount: number; followingCount: number }> {
  const res = await api.get(`/social/counts/${userId}`);
  return res.data;
}

export async function getFollowingFeed(page = 1): Promise<FeedResponse> {
  const res = await api.get(`/feed/following?page=${page}`);
  return res.data;
}

export async function getForYouFeed(page = 1): Promise<FeedResponse> {
  const res = await api.get(`/feed/for-you?page=${page}`);
  return res.data;
}

export async function searchUsers(q: string): Promise<SearchUser[]> {
  const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
  return res.data.users;
}

export async function uploadAvatar(avatar: string): Promise<{ user: import('../../auth/types/auth.types').User }> {
  const res = await api.put('/auth/me/avatar', { avatar });
  return res.data;
}
