export interface Profile {
  user_id: string;
  name: string;
  description?: string | null;
  profile_picture_url?: string | null;
}