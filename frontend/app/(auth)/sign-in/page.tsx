"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login } from "@/lib/api/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    router.push(role === "recruiter" ? "/dashboard" : "/jobs");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <VerifiedBeaconWordmark />

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-card border border-border bg-glass p-8"
      >
        <div>
          <h1 className="text-lg font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-dim">Sign in to continue</p>
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red">{error}</p>}

        <Button type="submit" isLoading={loading}>
          Sign in
        </Button>

        <p className="text-center text-sm text-ink-faint">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
