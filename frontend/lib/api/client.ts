/**
 * The ONLY place the frontend talks to a backend from. Always points at
 * backend-node — never the Python scoring service directly (see Rules.md §3).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiEnvelope<T> {
  data: T | null;
  error: string | null;
}

let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include", // sends the httpOnly refresh cookie when needed
      headers: {
        "Content-Type": "application/json",
        ...(inMemoryAccessToken ? { Authorization: `Bearer ${inMemoryAccessToken}` } : {}),
        ...options.headers,
      },
    });

    const body = (await res.json().catch(() => ({ data: null, error: "Invalid response" }))) as ApiEnvelope<T>;
    return body;
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to fetch" };
  }
}
