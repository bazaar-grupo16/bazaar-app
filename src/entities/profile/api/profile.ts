import { apiGet } from "@/shared/api/client";
import type { Profile } from "../model/types";

export async function getMyProfile(): Promise<Profile> {
  // Acomodar dsp la IP y puerto del backend correcto
  return apiGet<Profile>("http://10.0.2.2:8001/profile/me");
}