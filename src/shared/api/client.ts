import axios, { type InternalAxiosRequestConfig } from "axios";

import { refreshAuthSession, useAuthStore } from "@/shared/auth";
import { getApiBaseUrl, protectedApi, publicApi } from "./http";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function toApiError(error: unknown) {
  if (axios.isAxiosError(error) && error.response) {
    const responseData = error.response.data;
    const message =
      typeof responseData === "object" && responseData !== null && "detail" in responseData
        ? String((responseData as { detail?: unknown }).detail ?? error.response.statusText)
        : error.response.statusText || "API request failed";

    return new ApiError(message, error.response.status, responseData);
  }

  return null;
}

protectedApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

protectedApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error("[API] Error:", {
      isAxiosError: axios.isAxiosError(error),
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      detail: error.response?.data?.detail,
    });

    if (!axios.isAxiosError(error) || !error.config || error.response?.status !== 401) {
      throw error;
    }

    const originalRequest = error.config as RetryableRequestConfig;

    if (originalRequest._retry) {
      throw error;
    }

    originalRequest._retry = true;

    const refreshedSession = await refreshAuthSession();

    if (!refreshedSession) {
      throw error;
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${refreshedSession.access_token}`;

    return protectedApi.request(originalRequest);
  },
);

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  try {
    const { data } = await protectedApi.get<TResponse>(path);
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed", { path, status: apiError.status, details: apiError.details });
      }

      throw apiError;
    }

    throw error;
  }
}

export async function publicApiGet<TResponse>(path: string): Promise<TResponse> {
  try {
    const { data } = await publicApi.get<TResponse>(path);
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (PUBLIC GET)", { path, status: apiError.status, details: apiError.details });
      }

      throw apiError;
    }

    throw error;
  }
}

export async function publicApiPost<TResponse, TBody = unknown>(path: string, body: TBody): Promise<TResponse> {
  try {
    const { data } = await publicApi.post<TResponse>(path, body);
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (PUBLIC POST)", { path, status: apiError.status, details: apiError.details });
      }

      throw apiError;
    }

    throw error;
  }
}

export async function apiPost<TResponse, TBody = unknown>(path: string, body: TBody): Promise<TResponse> {
  try {
    const { data } = await protectedApi.post<TResponse>(path, body);
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (POST)", { path, status: apiError.status, details: apiError.details });
      }

      throw apiError;
    }

    throw error;
  }
}

export async function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  try {
    const { data } = await protectedApi.patch<TResponse>(path, body);
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
    if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (PATCH)", {
          path,
          status: apiError.status,
          details: apiError.details,
        });
      }

      throw apiError;
    }

    throw error;
  }
}

export async function apiDelete<TResponse = void>(
  path: string
): Promise<TResponse> {
  try {
    const { data } = await protectedApi.delete<TResponse>(path);
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
    if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (DELETE)", {
          path,
          status: apiError.status,
          details: apiError.details,
        });
      }

      throw apiError;
    }

    throw error;
  }
}

export async function apiDeleteWithBody<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  try {
    const { data } = await protectedApi.delete<TResponse>(path, {
      data: body,
    });
    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
    if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (DELETE with body)", {
          path,
          status: apiError.status,
          details: apiError.details,
        });
      }

      throw apiError;
    }

    throw error;
  }
}

// Axios + FormData + file:// URIs falla en Android (Network Error sin status).
// Esta función usa fetch nativo, que sí sabe streamear archivos locales,
// y reimplementa el refresh de token para no perder la protección del interceptor.
export async function apiPostForm<TResponse>(path: string, formData: FormData): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  async function doFetch(token: string | null): Promise<Response> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    console.log(`[API] --> POST ${path} (fetch)`, { hasToken: !!token });
    return fetch(url, { method: "POST", headers, body: formData });
  }

  async function parseResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return response.json() as Promise<T>;
    }
    let responseData: unknown;
    try { responseData = await response.json(); } catch { responseData = null; }
    const message =
      typeof responseData === "object" && responseData !== null && "detail" in responseData
        ? String((responseData as { detail?: unknown }).detail ?? response.statusText)
        : response.statusText || "API request failed";
    throw new ApiError(message, response.status, responseData);
  }

  try {
    let token = useAuthStore.getState().accessToken;
    let response = await doFetch(token);

    if (response.status === 401) {
      console.log(`[API] 401 on POST ${path} (fetch) — attempting token refresh...`);
      const refreshed = await refreshAuthSession();
      if (!refreshed) {
        console.error(`[API] Token refresh returned null — giving up on POST ${path}`);
        throw new ApiError("Unauthorized", 401);
      }
      console.log(`[API] Token refreshed OK — retrying POST ${path}`);
      token = refreshed.access_token;
      response = await doFetch(token);
    }

    console.log(`[API] <-- ${response.status} POST ${path} (fetch)`);
    return parseResponse<TResponse>(response);
  } catch (error: unknown) {
    console.log("[API] Full error:", JSON.stringify(error, null, 2));
    console.log("[API] Error response:", (error as any)?.response?.data);
    console.log("[API] Error request:", (error as any)?.request?._response);
    throw error;
  }
}
