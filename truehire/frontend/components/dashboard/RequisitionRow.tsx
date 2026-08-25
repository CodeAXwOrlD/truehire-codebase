"use client";

import Link from "next/link";
import { ChevronRight, Users, Activity } from "lucide-react";
import { RequisitionSummary } from "@/lib/api/requisitions";

interface RequisitionRowProps {
  requisition: RequisitionSummary;
}

export function RequisitionRow({ requisition }: RequisitionRowProps) {
  const daysOpen = Math.floor(
    (new Date().getTime() - new Date(requisition.openedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const riskLevel = requisition.latestGhostScore?.riskLevel ?? (daysOpen > 45 ? "high" : daysOpen > 20 ? "medium" : "low");
  const riskScore = requisition.latestGhostScore?.score ?? (daysOpen > 45 ? 78 : daysOpen > 20 ? 42 : 12);

  const riskColors = {
    low: "border-teal/30 bg-teal/10 text-teal",
    medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    high: "border-red-500/30 bg-red-500/10 text-red-400",
  };

  const statusColors = {
    open: "border-teal/20 text-teal",
    paused: "border-amber-500/20 text-amber-400",
    closed: "border-border text-ink-faint",
  };

  return (
    <Link
      href={`/dashboard/requisitions/${requisition.id}`}
      className="group flex items-center justify-between border-b border-border bg-transparent px-6 py-4 transition-colors hover:bg-glass-hover"
    >
      <div className="flex flex-1 items-center gap-6">
        <div className="min-w-[200px] max-w-[320px]">
          <h3 className="text-sm font-medium text-ink transition-colors group-hover:text-teal">
            {requisition.title}
          </h3>
          <p className="mt-0.5 text-xs text-ink-dim">{requisition.company}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-control border px-2.5 py-0.5 text-xs capitalize ${statusColors[requisition.status]}`}>
            {requisition.status}
          </span>
          {requisition.salaryRange && (
            <span className="text-xs text-ink-faint font-mono">{requisition.salaryRange}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 text-xs text-ink-dim">
          <div className="flex items-center gap-1.5" title="Total applicants">
            <Users size={14} className="text-ink-faint" />
            <span>{requisition.applicantCount}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Recent activity events">
            <Activity size={14} className="text-ink-faint" />
            <span>{requisition.eventCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-xs font-medium font-mono ${riskColors[riskLevel]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Risk: {riskScore}
          </div>
        </div>

        <span className="text-xs text-ink-faint font-mono min-w-[70px] text-right">
          {daysOpen === 0 ? "Today" : `${daysOpen}d ago`}
        </span>

        <ChevronRight size={16} className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
      </div>
    </Link>
  );
}
