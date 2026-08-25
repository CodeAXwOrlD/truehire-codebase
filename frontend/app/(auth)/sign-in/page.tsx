"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthSuccessAnimation } from "@/components/auth/AuthSuccessAnimation";
import { login } from "@/lib/api/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDestination, setSuccessDestination] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login({ email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const role = result.data?.user?.role;
    setSuccessDestination(role === "recruiter" ? "/dashboard" : "/jobs");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <VerifiedBeaconWordmark />

      {successDestination ? (
        <AuthSuccessAnimation
          title="Authentication Successful"
          subtitle="Identity verified. Establishing encrypted workspace session…"
          destination={successDestination === "/dashboard" ? "Recruiter Dashboard" : "Job Board"}
          onAnimationEnd={() => router.push(successDestination)}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-sm flex-col gap-5 rounded-card border border-border bg-glass p-8 shadow-2xl backdrop-blur-md"
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-1 text-xs text-ink-dim">Sign in to your TrueHire account</p>
          </div>

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-xs font-medium text-red">{error}</p>}

          <Button type="submit" isLoading={loading} className="w-full">
            Sign in
          </Button>

          <p className="border-t border-border/60 pt-4 text-center text-xs text-ink-faint">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-ink underline underline-offset-2 hover:text-teal">
              Sign up
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
