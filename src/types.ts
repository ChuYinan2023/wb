export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  created_at: string;
  thumbnail?: string;
}
