"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import { fetchRequisition, logRequisitionEvent, updateRequisition, RequisitionDetail } from "@/lib/api/requisitions";
import { ArrowLeft, Plus, Users, Calendar, Activity, CheckCircle, Clock, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STAGES = [
  { id: "applied", label: "Applied" },
  { id: "viewed", label: "Reviewed" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [requisition, setRequisition] = useState<RequisitionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pipeline" | "events" | "settings">("pipeline");
  const [loggingEvent, setLoggingEvent] = useState(false);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    const res = await fetchRequisition(id);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setRequisition(res.data);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleLogEvent(type: "interview" | "offer" | "activity") {
    if (!id) return;
    setLoggingEvent(true);
    await logRequisitionEvent(id, type);
    setLoggingEvent(false);
    loadData();
  }

  async function handleStatusChange(status: "open" | "paused" | "closed") {
    if (!id) return;
    await updateRequisition(id, { status });
    loadData();
  }

  if (loading) {
    return (
      <>
        <Topbar title="Requisition Details" />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-teal" />
        </main>
      </>
    );
  }

  if (error || !requisition) {
    return (
      <>
        <Topbar title="Requisition Details" />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-sm text-red-400">{error || "Requisition not found"}</p>
          <Button variant="secondary" onClick={() => router.push("/dashboard/requisitions")}>
            Back to Requisitions
          </Button>
        </main>
      </>
    );
  }

  const daysOpen = Math.floor(
    (new Date().getTime() - new Date(requisition.openedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Topbar title={requisition.title} />
      <main className="flex flex-1 flex-col px-8 py-8">
        {/* Breadcrumb Back */}
        <button
          onClick={() => router.push("/dashboard/requisitions")}
          className="mb-4 flex items-center gap-2 text-xs text-ink-dim transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to Requisitions
        </button>

        {/* Requisition Header Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface p-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-ink">{requisition.title}</h2>
              <span className="rounded-control border border-teal/20 bg-teal/5 px-2.5 py-0.5 text-xs font-medium text-teal capitalize">
                {requisition.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-dim">
              {requisition.company} {requisition.salaryRange ? `• ${requisition.salaryRange}` : ""} • Opened {daysOpen === 0 ? "Today" : `${daysOpen} days ago`}
            </p>
          </div>

          {/* Quick Action Event Loggers */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              disabled={loggingEvent}
              onClick={() => handleLogEvent("interview")}
              className="flex items-center gap-1.5 text-xs"
            >
              <Calendar size={13} />
              Log Interview
            </Button>
            <Button
              variant="secondary"
              disabled={loggingEvent}
              onClick={() => handleLogEvent("offer")}
              className="flex items-center gap-1.5 text-xs"
            >
              <CheckCircle size={13} />
              Log Offer
            </Button>
            <select
              value={requisition.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="rounded-control border border-border bg-surface px-3 py-2 text-xs text-ink outline-none"
            >
              <option value="open">Status: Open</option>
              <option value="paused">Status: Paused</option>
              <option value="closed">Status: Closed</option>
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex border-b border-border">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "pipeline"
                ? "border-teal text-teal"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            Candidate Pipeline ({requisition.applications?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "events"
                ? "border-teal text-teal"
                : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            Activity Timeline ({requisition.events?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "pipeline" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {STAGES.map((stage) => {
                const candidatesInStage =
                  requisition.applications?.filter((a) => a.stage === stage.id) || [];
                return (
                  <div
                    key={stage.id}
                    className="flex flex-col rounded-card border border-border bg-surface p-4"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                        {stage.label}
                      </span>
                      <span className="rounded-control bg-glass-hover px-2 py-0.5 text-xs font-mono text-ink-faint">
                        {candidatesInStage.length}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-1 flex-col gap-2 min-h-[160px]">
                      {candidatesInStage.length === 0 ? (
                        <p className="text-center text-xs text-ink-faint py-8">No applicants</p>
                      ) : (
                        candidatesInStage.map((app) => (
                          <div
                            key={app.id}
                            className="rounded-control border border-border bg-bg p-3 transition-colors hover:border-border-strong"
                          >
                            <p className="text-xs font-medium text-ink">{app.candidate?.user?.email || "Candidate"}</p>
                            {app.matchScore && (
                              <div className="mt-2 flex items-center justify-between text-[11px] text-teal">
                                <span>AI Match</span>
                                <span className="font-mono font-bold">{app.matchScore}%</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "events" && (
            <div className="rounded-card border border-border bg-surface p-6">
              <h3 className="text-sm font-semibold text-ink">Requisition Activity Log</h3>
              <p className="mt-0.5 text-xs text-ink-faint">
                Every logged interview and activity directly lowers ghost risk and confirms active hiring intent.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {requisition.events?.length === 0 ? (
                  <p className="text-xs text-ink-faint">No events logged yet.</p>
                ) : (
                  requisition.events?.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between border-b border-border/50 pb-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-teal/20 bg-teal/10 text-teal">
                          <Activity size={12} />
                        </div>
                        <div>
                          <p className="font-medium text-ink capitalize">{ev.type} Logged</p>
                          <p className="text-[11px] text-ink-faint font-mono">
                            {new Date(ev.occurredAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-control border border-border px-2 py-0.5 text-[11px] text-ink-dim capitalize">
                        {ev.type}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
