export interface Profile {
  user_id: string;
  name: string;
  description?: string | null;
  profile_picture_url?: string | null;
}

export interface PublicProfile {
  user_id: string;
  name: string;
  description?: string;
  profile_picture_url?: string;
}