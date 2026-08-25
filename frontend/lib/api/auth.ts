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
  email?: string;
  phone?: string;
  identifier?: string;
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

export async function sendWhatsAppOtp(phone: string, role: "candidate" | "recruiter" = "candidate") {
  return apiFetch<{ message: string; phone: string }>("/api/auth/whatsapp/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone, role }),
  });
}

export async function verifyWhatsAppOtp(phone: string, code: string) {
  const res = await apiFetch<AuthResponse>("/api/auth/whatsapp/verify-otp", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
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

export async function resendOtp(identifier: { email?: string; phone?: string; identifier?: string }) {
  return apiFetch<{ message: string }>("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(identifier),
  });
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
