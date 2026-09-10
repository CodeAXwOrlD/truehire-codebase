"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getMe, logout as apiLogout, login as apiLogin, signup as apiSignup, LoginInput, SignupInput, AuthResponse } from "@/lib/api/auth";
import { getAccessToken, setAccessToken } from "@/lib/api/client";

export interface AuthUser {
  id: string;
  email: string;
  role: "candidate" | "recruiter";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<{ data?: AuthResponse | null; error?: string | null }>;
  signup: (input: SignupInput) => Promise<{ data?: AuthResponse | null; error?: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ error: "AuthContext not initialized" }),
  signup: async () => ({ error: "AuthContext not initialized" }),
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await getMe();
      if (res.data) {
        setUser(res.data);
      } else {
        setUser(null);
        setAccessToken(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogin = async (input: LoginInput) => {
    const res = await apiLogin(input);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const handleSignup = async (input: SignupInput) => {
    const res = await apiSignup(input);
    if (res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    setUser(null);
    setAccessToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
