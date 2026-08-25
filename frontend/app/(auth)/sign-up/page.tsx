"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signup } from "@/lib/api/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isValid = hasMinLength && hasNumber && hasSpecial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError(null);
    setLoading(true);
    const result = await signup({ email, password, role });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16">
      <VerifiedBeaconWordmark />

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-5 rounded-card border border-border bg-glass p-8 shadow-2xl backdrop-blur-md"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-1 text-xs text-ink-dim">Real jobs, resolved.</p>
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

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Password Validation Indicator */}
          {password.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-1.5 rounded-control border border-border bg-surface p-2.5 text-xs">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-teal" : "text-ink-faint"}`}>
                {hasMinLength ? <Check size={13} /> : <X size={13} />}
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? "text-teal" : "text-ink-faint"}`}>
                {hasNumber ? <Check size={13} /> : <X size={13} />}
                <span>At least 1 number</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-teal" : "text-ink-faint"}`}>
                {hasSpecial ? <Check size={13} /> : <X size={13} />}
                <span>At least 1 special character (!@#$%^&*)</span>
              </div>
            </div>
          )}
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-xs font-medium text-ink-dim">I am joining as a</legend>
          <div className="flex gap-2">
            {(["candidate", "recruiter"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-control border px-3 py-2 text-xs font-medium capitalize transition-all ${
                  role === r
                    ? "border-teal bg-teal/10 text-teal shadow-sm"
                    : "border-border text-ink-dim hover:border-border-strong"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-xs font-medium text-red">{error}</p>}

        <Button type="submit" isLoading={loading} disabled={!isValid} className="w-full">
          Create account
        </Button>

        <p className="border-t border-border/60 pt-4 text-center text-xs text-ink-faint">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-ink underline underline-offset-2 hover:text-teal">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
