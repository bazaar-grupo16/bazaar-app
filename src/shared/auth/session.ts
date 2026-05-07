import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

import { publicApi } from "@/shared/api/http";
import type { TokenCreateResponse } from "@/entities/user/model";

const REFRESH_TOKEN_KEY = "bazaar.refreshToken";

interface AuthState {
  accessToken: string | null;
  isHydrating: boolean;
  setAccessToken: (token: string | null) => void;
  setHydrating: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isHydrating: true,
  setAccessToken: (token) => set({ accessToken: token }),
  setHydrating: (value) => set({ isHydrating: value }),
}));

export function useSessionUserId(): string | null {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) return null;
  try {
    const decoded = jwtDecode<{ sub?: string; user_id?: string; id?: string }>(accessToken);
    return decoded.sub || decoded.user_id || decoded.id || null;
  } catch (err) {
    return null;
  }
}

let refreshPromise: Promise<TokenCreateResponse | null> | null = null;

function readStringField(payload: Record<string, unknown>, keys: string[], fieldName: string) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  throw new Error(`Invalid auth token response: missing ${fieldName}`);
}

function readNumberField(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

export function normalizeTokenResponse(payload: Record<string, unknown>): TokenCreateResponse {
  return {
    access_token: readStringField(payload, ["access_token", "accessToken"], "access_token"),
    refresh_token: readStringField(payload, ["refresh_token", "refreshToken"], "refresh_token"),
    token_type: readStringField(payload, ["token_type", "tokenType"], "token_type"),
    expires_in: readNumberField(payload, ["expires_in", "expiresIn"]),
    refresh_expires_in: readNumberField(payload, ["refresh_expires_in", "refreshExpiresIn"]),
  };
}

export async function persistAuthSession(tokens: TokenCreateResponse) {
  useAuthStore.getState().setAccessToken(tokens.access_token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export async function clearAuthSession() {
  useAuthStore.getState().setAccessToken(null);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function requestTokenRefresh() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    return null;
  }

  try {
    const { data: rawData } = await publicApi.post<Record<string, unknown>>("/token/refresh", {
      refresh_token: refreshToken,
    });

    const data = normalizeTokenResponse(rawData);

    await persistAuthSession(data);

    return data;
  } catch (error) {
    if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      await clearAuthSession();
      return null;
    }

    throw error;
  }
}

export async function refreshAuthSession() {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function bootstrapAuthSession() {
  useAuthStore.getState().setHydrating(true);

  try {
    await refreshAuthSession();
  } finally {
    useAuthStore.getState().setHydrating(false);
  }
}