import { apiGet, apiPatch, apiPostForm } from "@/shared/api/client";
import type { Profile } from "../model/types";

export async function getMyProfile(): Promise<Profile> {
  return apiGet<Profile>("/profile/me");
}

export async function updateMyProfile(data: Partial<Profile>): Promise<Profile> {
  return apiPatch<Profile>("/profile/me", data);
}

export async function uploadAvatar(formData: FormData): Promise<{ url: string }> {
  return apiPostForm<{ url: string }>("/profile/upload-avatar", formData);
}