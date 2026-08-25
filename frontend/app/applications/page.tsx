"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VerifiedBeaconWordmark } from "@/components/brand/VerifiedBeacon";
import { fetchMyApplications } from "@/lib/api/jobs";
import { Briefcase, ArrowLeft, Clock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchMyApplications();
      setLoading(false);
      if (res.data) {
        setApplications(res.data);
      }
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/90 px-8 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <VerifiedBeaconWordmark />
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/jobs" className="text-ink-dim hover:text-ink transition-colors">
              Live Jobs
            </Link>
            <Link href="/applications" className="text-teal font-medium">
              My Applications
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-8 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">My Submitted Applications</h1>
            <p className="mt-1 text-sm text-ink-dim">
              Track candidate application statuses, interviews, and employer response times.
            </p>
          </div>

          <Link href="/jobs">
            <Button variant="primary" className="text-xs">
              Explore Live Jobs
            </Button>
          </Link>
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-ink-faint">
              <Loader2 size={16} className="animate-spin text-teal" />
              Loading applications…
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <Briefcase size={20} className="text-ink-faint" />
              <p className="text-sm font-medium text-ink">No applications tracked yet</p>
              <p className="text-xs text-ink-faint max-w-sm">
                Apply to verified roles on the live job board to track hiring milestones here.
              </p>
              <Link href="/jobs" className="mt-2">
                <Button variant="secondary" className="text-xs">
                  Browse Jobs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {applications.map((app, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 hover:bg-glass-hover">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{app.job?.title || "Role"}</h3>
                    <p className="text-xs text-ink-dim">{app.job?.company || "Company"}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 rounded-control border border-teal/30 bg-teal/10 px-2.5 py-1 text-xs font-mono text-teal capitalize">
                      <CheckCircle2 size={13} />
                      {app.status}
                    </span>
                    <span className="text-xs text-ink-faint font-mono">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
