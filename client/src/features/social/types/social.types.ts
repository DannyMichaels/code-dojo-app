export interface ActivityItem {
  _id: string;
  userId: {
    _id: string;
    username: string;
    name: string | null;
    avatar: string | null;
  };
  type: 'skill_started' | 'belt_promotion' | 'assessment_passed' | 'streak_milestone';
  data: Record<string, unknown>;
  createdAt: string;
  relevance?: number;
}

export interface FeedResponse {
  activities: ActivityItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FollowUser {
  _id: string;
  username: string;
  name: string | null;
  avatar: string | null;
}

export interface FollowListResponse {
  followers?: FollowUser[];
  following?: FollowUser[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchUser {
  _id: string;
  username: string;
  name: string | null;
  avatar: string | null;
}
