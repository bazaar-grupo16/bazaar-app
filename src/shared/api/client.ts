const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  }

  return API_BASE_URL.replace(/\/$/, "");
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const url = buildUrl(path);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let details: unknown;

    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed", {
        url,
        status: response.status,
        details,
      });
    }

    throw new ApiError(response.statusText, response.status, details);
  }

  return response.json() as Promise<TResponse>;
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let details: unknown;

    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed (POST)", {
        url,
        status: response.status,
        details,
      });
    }

    throw new ApiError(response.statusText, response.status, details);
  }

  return response.json() as Promise<TResponse>;
}
