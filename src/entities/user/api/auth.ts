import { publicApiPost } from "@/shared/api";
import { normalizeTokenResponse } from "@/shared/auth";
import type { LoginCredentials, RegisterCredentials, AuthResponse } from "../model";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const rawData = await publicApiPost<Record<string, unknown>>("/login", credentials);
    const data = normalizeTokenResponse(rawData);
    return data;
  } catch (error) {
    console.error("[auth.ts] loginUser failed:", error);
    throw error;
  }
}

export async function registerUser(credentials: RegisterCredentials): Promise<void> {
  await publicApiPost("/register", credentials);
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  return publicApiPost("/forgot-password", { email });
}

export async function verifyResetCode(data: { email: string; code: string }): Promise<void> {
  return publicApiPost("/verify-code", data);
}

export async function resetPassword(data: { email: string; code: string; new_password: string }): Promise<void> {
  return publicApiPost("/reset-password", data);
}

export async function loginWithGoogle(googleIdToken: string): Promise<AuthResponse> {
  const rawData = await publicApiPost<Record<string, unknown>>("/login/google", {
    google_id_token: googleIdToken,
  });
  return normalizeTokenResponse(rawData);
}
