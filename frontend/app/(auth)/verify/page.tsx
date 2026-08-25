"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { AuthSuccessAnimation } from "@/components/auth/AuthSuccessAnimation";
import { verifyEmail, resendOtp } from "@/lib/api/auth";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(45);
  const [verifiedDestination, setVerifiedDestination] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  async function handleVerify(codeToVerify?: string) {
    const finalCode = codeToVerify || code;
    if (!finalCode || finalCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError(null);
    setLoading(true);
    const result = await verifyEmail({
      email,
      code: finalCode,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const role = result.data?.user?.role;
    setVerifiedDestination(role === "recruiter" ? "/dashboard" : "/jobs");
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setError(null);
    setLoading(true);
    await resendOtp({ email });
    setLoading(false);
    setResendTimer(45);
  }

  if (verifiedDestination) {
    return (
      <AuthSuccessAnimation
        title="Verification Complete"
        subtitle="Your email credentials have been verified and encrypted."
        destination={verifiedDestination === "/dashboard" ? "Recruiter Dashboard" : "Job Board"}
        onAnimationEnd={() => router.push(verifiedDestination)}
      />
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-card border border-border bg-glass p-8 shadow-2xl backdrop-blur-md">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Verify your email</h1>
        <p className="mt-1 text-xs text-ink-dim">
          We sent a 6-digit verification code to{" "}
          <span className="font-mono font-medium text-teal">{email || "your email"}</span>
        </p>
      </div>

      <div>
        <label className="mb-2.5 block text-xs font-medium text-ink-dim">
          6-digit Security Code
        </label>
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={(enteredCode) => handleVerify(enteredCode)}
          disabled={loading}
        />
      </div>

      {error && <p className="text-xs font-medium text-red">{error}</p>}

      <Button
        type="button"
        isLoading={loading}
        disabled={code.length !== 6}
        onClick={() => handleVerify()}
        className="w-full"
      >
        Confirm & Unlock
      </Button>

      {/* Resend & Back controls */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-4 text-center text-xs text-ink-faint">
        <div className="flex items-center justify-between">
          <span>Didn&apos;t receive code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || loading}
            className={`font-medium transition-colors ${
              resendTimer > 0
                ? "text-ink-faint cursor-not-allowed"
                : "text-teal hover:underline"
            }`}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
          </button>
        </div>

        <p className="mt-1">
          Wrong email?{" "}
          <Link href="/sign-up" className="text-ink underline underline-offset-2 hover:text-teal">
            Go back
          </Link>
        </p>
      </div>
    </div>
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
