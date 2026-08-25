"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createRequisition, CreateRequisitionInput, RequisitionSummary } from "@/lib/api/requisitions";

interface CreateRequisitionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (req: RequisitionSummary) => void;
}

export function CreateRequisitionModal({ open, onClose, onSuccess }: CreateRequisitionModalProps) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !company.trim()) {
      setError("Job title and company name are required");
      return;
    }

    setLoading(true);
    setError(null);

    const input: CreateRequisitionInput = {
      title: title.trim(),
      company: company.trim(),
      salaryRange: salaryRange.trim() || undefined,
      status: "open",
    };

    const res = await createRequisition(input);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    if (res.data) {
      onSuccess(res.data);
      onClose();
      setTitle("");
      setCompany("");
      setSalaryRange("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Create new requisition"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-card border border-border-strong bg-surface p-6 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-base font-semibold text-ink">New Requisition</h2>
          <button
            onClick={onClose}
            className="rounded-control p-1 text-ink-faint transition-colors hover:bg-glass-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {error && (
            <div className="rounded-control border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <Input
            label="Job Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            required
            autoFocus
          />

          <Input
            label="Company *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            required
          />

          <Input
            label="Salary Range (optional)"
            value={salaryRange}
            onChange={(e) => setSalaryRange(e.target.value)}
            placeholder="e.g. $140,000 - $170,000"
          />

          <div className="mt-4 flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Requisition
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
