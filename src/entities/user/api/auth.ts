import { apiPost } from "@/shared/api";
import type { LoginCredentials, RegisterCredentials, AuthResponse } from "../model";

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiPost<AuthResponse, LoginCredentials>("/login", credentials);
}

export async function registerUser(credentials: RegisterCredentials): Promise<void> {
  return apiPost<void, RegisterCredentials>("/register", credentials);
}

// TODO: Verificar que el endpoint /logout existe en el backend
// export async function logoutUser(): Promise<void> {
//   return apiPost<void>("/logout", {});
// }