"use client";

import { useState } from "react";
import { X, Sparkles, Plus, User, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CandidateProfile, updateCandidateProfile } from "@/lib/api/candidate";
import { ResumeUploadZone } from "@/components/jobs/ResumeUploadZone";
import type { ResumeParseResult } from "@/lib/api/jobs";

interface ProfileModalProps {
  profile: CandidateProfile;
  open: boolean;
  onClose: () => void;
  onSaved: (p: CandidateProfile) => void;
}

export function ProfileModal({ profile, open, onClose, onSaved }: ProfileModalProps) {
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [resumeText, setResumeText] = useState(profile.resumeText || "");
  const [saving, setSaving] = useState(false);

  function handleResumeParsed(result: ResumeParseResult) {
    const combined = [...skills, ...result.skills];
    const merged = combined.filter((skill, idx) => combined.indexOf(skill) === idx);
    setSkills(merged);
  }

  if (!open) return null;

  function addSkill() {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

  async function handleSave() {
    setSaving(true);
    const res = await updateCandidateProfile({
      skills,
      resumeText,
    });
    setSaving(false);
    if (res.data) {
      onSaved(res.data);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-zinc-700/80 bg-[#121217] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <User size={18} className="text-teal" />
            <h2 id="profile-modal-title" className="text-base font-semibold text-ink">Candidate Skills &amp; Profile</h2>
          </div>
          <button onClick={onClose} className="rounded-control p-1 text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-ink-dim">Your Tech Stack</label>
            <div className="mt-2 flex flex-wrap gap-1.5 min-h-[40px] p-2 rounded-control border border-border bg-bg">
              {skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 rounded-control border border-teal/30 bg-teal/10 px-2 py-0.5 text-xs font-mono text-teal"
                >
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-red-400">
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Add skill (e.g. Docker, GraphQL, Go)…"
                className="flex-1 rounded-control border border-border bg-glass px-3 py-1.5 text-xs text-ink outline-none"
              />
              <Button variant="secondary" onClick={addSkill} className="text-xs py-1.5">
                <Plus size={13} />
                Add
              </Button>
            </div>
          </div>

          {/* Resume file upload (compact zone) */}
          <div>
            <label className="text-xs font-medium text-ink-dim flex items-center gap-1.5 mb-2">
              <Sparkles size={13} className="text-teal" />
              Upload Resume to Auto-Extract Skills (PDF / DOCX)
            </label>
            <ResumeUploadZone onParsed={handleResumeParsed} compact />
          </div>

          <div>
            <label className="text-xs font-medium text-ink-dim flex items-center gap-1.5">
              <FileText size={13} className="text-ink-faint" />
              Paste Resume Bio / Experience Summary (AI Auto-Skill Extraction)
            </label>
            <textarea
              rows={4}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your bio, resume summary, or bullet points to auto-detect tech stack…"
              className="mt-1.5 w-full rounded-control border border-border bg-glass p-3 text-xs text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={saving} className="text-xs">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} className="text-xs flex items-center gap-1.5">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save &amp; Update Matches
          </Button>
        </div>
      </div>
    </div>
  );
}
