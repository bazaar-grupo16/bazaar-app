import { apiPost } from "@/shared/api";
import type { LoginCredentials, RegisterCredentials, AuthResponse } from "../model";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse, LoginCredentials>("/auth/login", credentials);
}

export async function registerUser(credentials: RegisterCredentials): Promise<void> {
  return apiPost<void, RegisterCredentials>("/auth/register", credentials);
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  return apiPost<void, { email: string }>("/auth/forgot-password", { email });
}

export async function verifyResetCode(data: { email: string; code: string }): Promise<void> {
  return apiPost("/auth/verify-code", data);
}

export async function resetPassword(data: { email: string; code: string; new_password: string }): Promise<void> {
  return apiPost("/auth/reset-password", data);
}
