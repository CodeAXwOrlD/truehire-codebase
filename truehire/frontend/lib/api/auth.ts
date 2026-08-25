import { apiFetch, setAccessToken } from "./client";

export interface SignupInput {
  email: string;
  password: string;
  role: "candidate" | "recruiter";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyInput {
  email: string;
  code: string;
}

export interface AuthResponse {
  accessToken?: string;
  message?: string;
  user?: {
    id: string;
    email: string;
    role: "candidate" | "recruiter";
  };
}

export async function signup(input: SignupInput) {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function login(input: LoginInput) {
  const res = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (res.data?.accessToken) {
    setAccessToken(res.data.accessToken);
  }
  return res;
}

export async function verifyEmail(input: VerifyInput) {
  const res = await apiFetch<AuthResponse>("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (res.data?.accessToken) {
    setAccessToken(res.data.accessToken);
  }
  return res;
}

export async function logout() {
  const res = await apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
  setAccessToken(null);
  return res;
}

export async function getMe() {
  return apiFetch<{ id: string; email: string; role: "candidate" | "recruiter" }>("/api/auth/me");
}
