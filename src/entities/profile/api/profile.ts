import { apiGet, apiPatch, apiPostForm } from "@/shared/api/client";
import type { Profile, PublicProfile } from "../model/types";
import { useAuthStore } from "@/shared/auth";

export async function getMyProfile(): Promise<Profile> {
  return apiGet<Profile>("/profile/me");
}

export async function updateMyProfile(data: Partial<Profile>): Promise<Profile> {
  return apiPatch<Profile>("/profile/me", data);
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  return apiGet<PublicProfile>(`/profile/${userId}`);
}
export async function uploadAvatar(formData: FormData): Promise<{ url: string }> {
  return apiPostForm<{ url: string }>("/profile/upload-avatar", formData);
}