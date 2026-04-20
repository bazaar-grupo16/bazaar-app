import { apiPost } from "@/shared/api";
import type { LoginCredentials, RegisterCredentials, AuthResponse } from "../model";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse, LoginCredentials>("/login", credentials);
}

export async function registerUser(credentials: RegisterCredentials): Promise<void> {
  return apiPost<void, RegisterCredentials>("/register", credentials);
}