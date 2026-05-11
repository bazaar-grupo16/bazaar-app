import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import { refreshAuthSession, useAuthStore } from "@/shared/auth";
import { protectedApi, publicApi } from "./http";

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

export async function apiPostForm<TResponse>(path: string, formData: FormData): Promise<TResponse> {
  try {
    const { data } = await protectedApi.post<TResponse>(path, formData);

    return data;
  } catch (error) {
    const apiError = toApiError(error);

    if (apiError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("API request failed (POST form)", {
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
