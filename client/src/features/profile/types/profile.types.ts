export interface PublicProfile {
  _id: string;
  username: string;
  name: string | null;
  bio: string;
  avatarUrl: string | null;
  created: string;
  skillCount: number;
}

export interface PublicSkill {
  _id: string;
  skillCatalogId: { name: string; slug: string; icon: string | null };
  currentBelt: string;
  createdAt: string;
}
