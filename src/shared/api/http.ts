import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_BASE_URL");
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  console.log("[http.ts] API base URL:", baseUrl);
  return baseUrl;
}

export const publicApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
  },
});

console.log("[http.ts] publicApi created with baseURL:", publicApi.defaults.baseURL);

export const protectedApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
  },
});

console.log("[http.ts] protectedApi created with baseURL:", protectedApi.defaults.baseURL);