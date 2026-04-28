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