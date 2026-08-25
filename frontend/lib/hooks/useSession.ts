"use client";

import { useEffect, useState } from "react";
import { apiFetch, setAccessToken } from "@/lib/api/client";

export interface SessionUser {
  id: string;
  email: string;
  role: "candidate" | "recruiter";
}

interface RefreshResult {
  accessToken: string;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const refreshed = await apiFetch<RefreshResult>("/api/auth/refresh", { method: "POST" });
      if (cancelled) return;

      if (!refreshed.data?.accessToken) {
        setLoading(false);
        return;
      }

      setAccessToken(refreshed.data.accessToken);
      const me = await apiFetch<SessionUser>("/api/auth/me");
      if (!cancelled && me.data) {
        setUser(me.data);
      }
      setLoading(false);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, setUser };
}
