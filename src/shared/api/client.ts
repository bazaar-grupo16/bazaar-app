const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

function authHeader(): Record<string, string> {
  return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
}

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
      ...authHeader(),
    },
  });

  let data: any;

  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  if (!response.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed", { url, status: response.status, details: data });
    }

    throw new ApiError(response.statusText, response.status, data);
  }

  return data as TResponse;
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
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
      console.warn("API request failed (POST)", { url, status: response.status, details });
    }

    throw new ApiError(response.statusText, response.status, details);
  }

  return response.json() as Promise<TResponse>;
}

export async function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let details: unknown;
    try { details = await response.json(); } catch { details = await response.text(); }
    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed (PATCH)", { url, status: response.status, details });
    }
    throw new ApiError(response.statusText, response.status, details);
  }

  return response.json() as Promise<TResponse>;
}

export async function apiDelete<TResponse = void>(
  path: string
): Promise<TResponse> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
  });

  if (!response.ok) {
    let details: unknown;
    try { details = await response.json(); } catch { details = await response.text(); }
    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed (DELETE)", { url, status: response.status, details });
    }
    throw new ApiError(response.statusText, response.status, details);
  }

  if (response.status === 204) return undefined as TResponse;
  return response.json() as Promise<TResponse>;
}

export async function apiDeleteWithBody<TResponse, TBody = unknown>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let details: unknown;
    try { details = await response.json(); } catch { details = await response.text(); }
    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed (DELETE with body)", { url, status: response.status, details });
    }
    throw new ApiError(response.statusText, response.status, details);
  }

  if (response.status === 204) return undefined as TResponse;
  return response.json() as Promise<TResponse>;
}

export async function apiPostForm<TResponse>(
  path: string,
  formData: FormData
): Promise<TResponse> {
  const url = buildUrl(path);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      // No Content-Type: fetch sets multipart/form-data with boundary automatically
      Accept: "application/json",
      ...authHeader(),
    },
    body: formData,
  });

  if (!response.ok) {
    let raw: string | null = null;
    let details: unknown = null;

    try {
      raw = await response.text();

      try {
        details = raw ? JSON.parse(raw) : null;
      } catch {
        details = raw;
      }
    } catch {
      details = null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("API request failed (POST form)", { url, status: response.status, details });
    }

    throw new ApiError(response.statusText, response.status, details);
  }

  return response.json() as Promise<TResponse>;
}
