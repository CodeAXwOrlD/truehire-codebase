"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { RequisitionRow } from "@/components/dashboard/RequisitionRow";
import { CreateRequisitionModal } from "@/components/dashboard/CreateRequisitionModal";
import { fetchRequisitions, RequisitionSummary } from "@/lib/api/requisitions";
import { Plus, Search, Filter, Briefcase, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function RequisitionsPage() {
  const [requisitions, setRequisitions] = useState<RequisitionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    const res = await fetchRequisitions(statusFilter === "all" ? undefined : statusFilter);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setRequisitions(res.data);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filtered = requisitions.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.company.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <>
      <Topbar title="Requisitions" />
      <main className="flex flex-1 flex-col px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Active Job Requisitions</h2>
            <p className="mt-1 text-sm text-ink-dim">
              Manage your hiring pipelines, applicant flows, and monitor ghost-score risk signals.
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

        {/* Filters & Search Toolbar */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-control border border-border bg-surface p-1">
            {["all", "open", "paused", "closed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`rounded-control px-3 py-1.5 text-xs capitalize transition-colors ${
                  statusFilter === tab
                    ? "bg-glass-hover font-medium text-ink"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-1.5">
            <Search size={14} className="text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title or company…"
              className="bg-transparent text-xs text-ink outline-none placeholder:text-ink-faint w-48"
            />
          </div>
        </div>

        {/* Table / List Container */}
        <div className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
          {loading ? (
            <div className="flex h-64 items-center justify-center gap-2 text-sm text-ink-faint">
              <Loader2 size={16} className="animate-spin text-teal" />
              Loading requisitions…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg">
                <Briefcase size={18} className="text-ink-faint" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">No requisitions found</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {search ? "No requisitions matched your search query." : "Get started by creating your first job requisition."}
                </p>
              </div>
              {!search && (
                <Button
                  variant="secondary"
                  onClick={() => setModalOpen(true)}
                  className="mt-2 text-xs"
                >
                  Create Requisition
                </Button>
              )}
            </div>
          ) : (
            <div>
              {filtered.map((req) => (
                <RequisitionRow key={req.id} requisition={req} />
              ))}
            </div>
          )}
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
