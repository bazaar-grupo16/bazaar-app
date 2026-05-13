import { apiGet, apiPatch, apiPostForm } from "@/shared/api/client";
import type { Profile } from "../model/types";
import { useAuthStore } from "@/shared/auth";

export async function getMyProfile(): Promise<Profile> {
  return apiGet<Profile>("/profile/me");
}

export async function updateMyProfile(data: Partial<Profile>): Promise<Profile> {
  return apiPatch<Profile>("/profile/me", data);
}

export async function uploadAvatar(formData: FormData) {
  console.log("Intentando subir con fetch nativo...");
  
  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
    const token = useAuthStore.getState().accessToken;

    const response = await fetch(`${baseUrl}/profile/upload-avatar`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("El backend lo rechazó:", errorText);
      throw new Error("Rechazado por el backend");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fallo Fetch:", error);
    throw error;
  }
}