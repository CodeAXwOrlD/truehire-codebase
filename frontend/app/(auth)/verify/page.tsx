"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { verifyEmail } from "@/lib/api/auth";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await verifyEmail({ email, code });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/sign-in"), 1200);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-5 rounded-card border border-border bg-glass p-8"
    >
      <div>
        <h1 className="text-lg font-semibold text-ink">Verify your email</h1>
        <p className="mt-1 text-sm text-ink-dim">
          We sent a 6-digit code to <span className="text-ink">{email || "your email"}</span>
        </p>
      </div>

      <Input
        label="Verification code"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        className="font-mono tracking-[0.3em]"
      />

      {error && <p className="text-sm text-red">{error}</p>}
      {success && <p className="text-sm text-teal">Verified — redirecting to sign in…</p>}

      <Button type="submit" isLoading={loading}>
        Verify
      </Button>

      <p className="text-center text-sm text-ink-faint">
        Wrong email?{" "}
        <Link href="/sign-up" className="text-ink underline underline-offset-2">
          Go back
        </Link>
      </p>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <VerifiedBeaconWordmark />
      <Suspense fallback={null}>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
