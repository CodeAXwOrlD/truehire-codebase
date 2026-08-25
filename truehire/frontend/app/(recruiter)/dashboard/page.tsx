"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/Topbar";
import { Briefcase, Plus, Users, ShieldCheck, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { RequisitionRow } from "@/components/dashboard/RequisitionRow";
import { CreateRequisitionModal } from "@/components/dashboard/CreateRequisitionModal";
import { fetchRequisitions, RequisitionSummary } from "@/lib/api/requisitions";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHomePage() {
  const [requisitions, setRequisitions] = useState<RequisitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchRequisitions();
      setLoading(false);
      if (res.data) {
        setRequisitions(res.data);
      }
    }
    load();
  }, []);

  const totalOpen = requisitions.filter((r) => r.status === "open").length;
  const totalApplicants = requisitions.reduce((acc, curr) => acc + curr.applicantCount, 0);

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex flex-1 flex-col gap-8 px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{greeting()}, Recruiter</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Overview of your active requisitions, applicant pipelines, and anti-ghost health.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={15} />
            New requisition
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-ink-dim">
              <span className="text-xs font-medium uppercase tracking-wider">Active Requisitions</span>
              <Briefcase size={16} className="text-teal" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink">{totalOpen}</span>
              <span className="text-xs text-ink-faint">of {requisitions.length} total</span>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-ink-dim">
              <span className="text-xs font-medium uppercase tracking-wider">Pipeline Applicants</span>
              <Users size={16} className="text-teal" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-ink">{totalApplicants}</span>
              <span className="text-xs text-teal">Candidates in review</span>
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center justify-between text-ink-dim">
              <span className="text-xs font-medium uppercase tracking-wider">Ghost Risk Status</span>
              <ShieldCheck size={16} className="text-teal" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-teal">Healthy</span>
              <span className="text-xs text-ink-faint">Active hiring verified</span>
            </div>
          </div>
        </div>

        {/* Recent Requisitions Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Recent Requisitions</h3>
            <Link
              href="/dashboard/requisitions"
              className="flex items-center gap-1 text-xs text-ink-dim hover:text-teal"
            >
              View all ({requisitions.length})
              <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {loading ? (
              <div className="flex h-40 items-center justify-center gap-2 text-sm text-ink-faint">
                <Loader2 size={16} className="animate-spin text-teal" />
                Loading requisitions…
              </div>
            ) : requisitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg">
                  <Briefcase size={18} className="text-ink-faint" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">No requisitions yet</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Create your first requisition to start managing candidates and tracking risk signals.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setModalOpen(true)}
                  className="mt-2 text-xs flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  New requisition
                </Button>
              </div>
            ) : (
              <div>
                {requisitions.slice(0, 5).map((req) => (
                  <RequisitionRow key={req.id} requisition={req} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateRequisitionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newReq) => setRequisitions((prev) => [newReq, ...prev])}
      />
    </>
  );
}
