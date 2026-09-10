"use client";

import { useState } from "react";
import { X, Sparkles, Check, Plus, Briefcase, Award, Globe, FileText, ArrowRight } from "lucide-react";
import { ResumeParseResult, ExperienceLevel } from "@/lib/api/jobs";

export interface ResumeTunePreferences {
  targetRole: string;
  experienceLevel: ExperienceLevel;
  selectedSkills: string[];
  isRemote: boolean;
}

interface ResumeReviewModalProps {
  open: boolean;
  parseResult: ResumeParseResult | null;
  onClose: () => void;
  onApplyPreferences: (prefs: ResumeTunePreferences) => void;
}

export function ResumeReviewModal({
  open,
  parseResult,
  onClose,
  onApplyPreferences,
}: ResumeReviewModalProps) {
  if (!open || !parseResult) return null;

  const [targetRole, setTargetRole] = useState(
    parseResult.detectedRoles[0] || "Software Engineer"
  );
  const [customRoleInput, setCustomRoleInput] = useState("");

  // Infer experience level
  const defaultExpLevel: ExperienceLevel =
    parseResult.experienceYears <= 1
      ? "entry"
      : parseResult.experienceYears <= 4
      ? "mid"
      : parseResult.experienceYears <= 7
      ? "senior"
      : "lead";

  const [expLevel, setExpLevel] = useState<ExperienceLevel>(defaultExpLevel);

  // Selected skills state (all extracted skills active by default)
  const [skills, setSkills] = useState<string[]>(parseResult.skills);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(parseResult.skills)
  );
  const [newSkillInput, setNewSkillInput] = useState("");
  const [isRemote, setIsRemote] = useState(true);

  function toggleSkill(skill: string) {
    const next = new Set(selectedSkills);
    if (next.has(skill)) {
      next.delete(skill);
    } else {
      next.add(skill);
    }
    setSelectedSkills(next);
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
    const next = new Set(selectedSkills);
    next.delete(skill);
    setSelectedSkills(next);
  }

  function handleAddSkill() {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      const next = new Set(selectedSkills);
      next.add(trimmed);
      setSelectedSkills(next);
    }
    setNewSkillInput("");
  }

  function handleApply() {
    onApplyPreferences({
      targetRole: customRoleInput.trim() || targetRole,
      experienceLevel: expLevel,
      selectedSkills: Array.from(selectedSkills),
      isRemote,
    });
    onClose();
  }

  const expOptions: { label: string; value: ExperienceLevel; sub: string }[] = [
    { label: "Entry", value: "entry", sub: "0-2 yrs" },
    { label: "Mid", value: "mid", sub: "3-5 yrs" },
    { label: "Senior", value: "senior", sub: "5-8 yrs" },
    { label: "Lead / Staff", value: "lead", sub: "8+ yrs" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-review-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-700/80 bg-[#121217] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal/40 bg-teal/10 text-teal">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="resume-review-title" className="text-base font-bold text-white">
                Resume Extracted — Review &amp; Set Filters
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                <FileText size={12} className="text-teal" />
                <span>{parseResult.filename}</span>
                <span>·</span>
                <span>{parseResult.summary}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Target Role */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              <Briefcase size={14} className="text-teal" />
              1. Target Role &amp; Title
            </label>
            <div className="flex flex-wrap gap-2 mb-2.5">
              {parseResult.detectedRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setTargetRole(role);
                    setCustomRoleInput("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    targetRole === role && !customRoleInput
                      ? "border-teal bg-teal/15 text-white font-semibold shadow-sm"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom job title (e.g. Senior Frontend Engineer)"
              value={customRoleInput}
              onChange={(e) => setCustomRoleInput(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-teal focus:outline-none"
            />
          </div>

          {/* Section 2: Experience Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <Award size={14} className="text-teal" />
                2. Experience Level
              </label>
              <span className="text-xs font-mono text-teal font-medium bg-teal/10 px-2 py-0.5 rounded border border-teal/30">
                {parseResult.experienceYears === 0
                  ? "Detected: Entry Level / Intern (< 1 yr)"
                  : parseResult.experienceYears === 1
                  ? "Detected: 1 year"
                  : `Detected: ${parseResult.experienceYears}+ years`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {expOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpLevel(opt.value)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center ${
                    expLevel === opt.value
                      ? "border-teal bg-teal/15 text-white font-semibold shadow-sm"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-xs font-medium">{opt.label}</span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Extracted Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <Sparkles size={14} className="text-teal" />
                3. Technical Skills ({selectedSkills.size} of {skills.length} active)
              </label>
              <span className="text-[11px] text-zinc-400">
                Click chip to toggle, &times; to remove
              </span>
            </div>

            {/* Skills Pills */}
            <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 min-h-[90px]">
              {skills.map((skill) => {
                const isSelected = selectedSkills.has(skill);
                return (
                  <div
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border transition-all select-none ${
                      isSelected
                        ? "border-teal/60 bg-teal/15 text-teal font-semibold shadow-sm"
                        : "border-zinc-800 bg-zinc-900/80 text-zinc-400 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {isSelected && <Check size={12} className="text-teal shrink-0" />}
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkill(skill);
                      }}
                      className="ml-1 text-zinc-400 hover:text-red-400 transition-colors p-0.5 rounded"
                      title="Remove skill"
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
              {skills.length === 0 && (
                <p className="text-xs text-zinc-500 italic py-2">No skills detected. Add your skills below.</p>
              )}
            </div>

            {/* Add Skill Input */}
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add missing skill (e.g. AWS, Kubernetes, GraphQL)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-teal focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
              >
                <Plus size={13} />
                Add
              </button>
            </div>
          </div>

          {/* Section 4: Work Mode Preference */}
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              <Globe size={14} className="text-teal" />
              4. Work Location
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsRemote(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  isRemote
                    ? "border-teal bg-teal/15 text-white font-semibold"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Remote Only
              </button>
              <button
                type="button"
                onClick={() => setIsRemote(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  !isRemote
                    ? "border-teal bg-teal/15 text-white font-semibold"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                Any Location (Remote + On-site)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-6 py-4 bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-black hover:bg-teal/90 shadow-lg shadow-teal/20 transition-all"
          >
            <span>Apply Filters &amp; Match Jobs ({selectedSkills.size} Skills)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
