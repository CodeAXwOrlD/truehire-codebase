/**
 * The ONLY place the frontend talks to a backend from. Always points at
 * backend-node — never the Python scoring service directly (see Rules.md §3).
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiEnvelope<T> {
  data: T | null;
  error: string | null;
}

const TOKEN_KEY = "th_access_token";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const local = localStorage.getItem(TOKEN_KEY);
    if (local) return local;

    // Fallback: check document.cookie
    const match = document.cookie.match(new RegExp("(^| )" + TOKEN_KEY + "=([^;]+)"));
    if (match) return match[2];
  } catch {
    // ignore
  }
  return null;
}

let inMemoryAccessToken: string | null = getStoredToken();

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window === "undefined") return;

  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      // Persist in cookie for 7 days
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {
    // ignore storage restrictions
  }
}

export function getAccessToken(): string | null {
  if (!inMemoryAccessToken) {
    inMemoryAccessToken = getStoredToken();
  }
  return inMemoryAccessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const token = getAccessToken();

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include", // sends the httpOnly refresh cookie
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    // If 401 and not already refreshing, attempt silent refresh
    if (res.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login") && !path.includes("/auth/signup")) {
      try {
        const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const refreshBody = await refreshRes.json();
        if (refreshBody.data?.accessToken) {
          setAccessToken(refreshBody.data.accessToken);
          // Retry original request with new token
          const retryRes = await fetch(`${API_URL}${path}`, {
            ...options,
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshBody.data.accessToken}`,
              ...options.headers,
            },
          });
          return await retryRes.json();
        }
      } catch {
        // refresh failed
      }
    }

    const body = (await res.json().catch(() => ({ data: null, error: "Invalid response" }))) as ApiEnvelope<T>;
    return body;
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Failed to fetch" };
  }
}
