import { apiGet, apiPatch, apiPostForm } from "@/shared/api/client";
import type { Profile } from "../model/types";

export async function getMyProfile(): Promise<Profile> {
  // Acomodar dsp la IP y puerto del backend correcto
  return apiGet<Profile>("http://10.0.2.2:8001/profile/me");
}

export async function updateMyProfile(data: Partial<Profile>): Promise<Profile> {
  return apiPatch<Profile>("http://10.0.2.2:8001/profile/me", data);
}

export async function uploadAvatar(formData: FormData) {
  console.log("Intentando subir con fetch nativo...");
  
  try {
    const response = await fetch("http://10.0.2.2:8001/profile/upload-avatar", {
      method: "POST",
      headers: {
        // Tu ID hardcodeado para que pase la validación
        "x-user-id": "954b4d99-c1a4-48e7-8849-e9a84731fe45", 
      },
      body: formData, // Le pasamos el mismo formData que armaste como tus compañeros
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