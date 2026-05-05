import { apiPost } from "@/shared/api";
import type { LoginCredentials, RegisterCredentials, AuthResponse } from "../model";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse, LoginCredentials>("/login", credentials);
}

export async function registerUser(credentials: RegisterCredentials): Promise<void> {
  return apiPost<void, RegisterCredentials>("/register", credentials);
}

export async function sendForgotPasswordEmail(email: string): Promise<void> {
  return apiPost<void, { email: string }>("/forgot-password", { email });
}

export async function verifyResetCode(data: { email: string; code: string }): Promise<void> {
  return apiPost("/verify-code", data);
}

export async function resetPassword(data: { email: string; code: string; new_password: string }): Promise<void> {
  return apiPost("/reset-password", data);
}
