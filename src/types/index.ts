export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "threads"
  | "twitter"
  | "linkedin";

export interface Identity {
  id: string;
  name: string;
  description: string;
  avatarText: string;
  avatarColor: string;
  isActive: boolean;
  articleCount: number;
  slug: string;
}

export interface Article {
  id: string;
  identityId: string;
  title: string;
  excerpt: string;
  status: ArticleStatus;
  coverImage?: string;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  targetPlatforms: SocialPlatform[];
  hashtags: string[];
}

export interface IdentityStats {
  pendingReview: number;
  published: number;
  scheduled: number;
  generatedThisWeek: number;
}

export interface HookTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  usageCount: number;
}
