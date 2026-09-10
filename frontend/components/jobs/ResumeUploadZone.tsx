"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, Loader2, X, Sparkles } from "lucide-react";
import { parseResume, ResumeParseResult } from "@/lib/api/jobs";

interface ResumeUploadZoneProps {
  onParsed: (result: ResumeParseResult) => void;
  compact?: boolean;
}

type UploadState = "idle" | "uploading" | "success" | "error";

/**
 * Drag-and-drop resume upload zone.
 * Accepts PDF or DOCX, sends to Python NLP service, returns extracted skills instantly.
 * No "scan in progress" spinner — results appear in ~1-2 seconds (HiringCafe style).
 */
export function ResumeUploadZone({ onParsed, compact = false }: ResumeUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<ResumeParseResult | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"];
      const extOk = file.name.endsWith(".pdf") || file.name.endsWith(".docx") || file.name.endsWith(".doc");
      if (!allowed.includes(file.type) && !extOk) {
        setUploadState("error");
        setErrorMsg("Please upload a PDF or DOCX file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadState("error");
        setErrorMsg("File size must be under 5 MB.");
        return;
      }

      setUploadState("uploading");
      setErrorMsg("");
      setLastResult(null);

      const result = await parseResume(file);

      if (result.data) {
        setUploadState("success");
        setLastResult(result.data);
        onParsed(result.data);
      } else {
        setUploadState("error");
        setErrorMsg(result.error || "Failed to parse resume. Please try another file.");
      }
    },
    [onParsed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-uploaded
    e.target.value = "";
  };

  const reset = () => {
    setUploadState("idle");
    setErrorMsg("");
    setLastResult(null);
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={handleInputChange}
        />
        {uploadState === "success" && lastResult ? (
          <div className="flex items-center gap-2 rounded-control border border-teal/30 bg-teal/5 px-3 py-2 text-xs">
            <CheckCircle2 size={14} className="text-teal shrink-0" />
            <span className="text-teal font-medium">{lastResult.skills.length} skills extracted</span>
            <button onClick={reset} className="ml-auto text-ink-faint hover:text-ink">
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploadState === "uploading"}
            className="flex items-center gap-2 rounded-control border border-dashed border-border bg-glass px-3 py-2 text-xs text-ink-dim hover:border-teal hover:text-teal transition-colors disabled:opacity-50"
          >
            {uploadState === "uploading" ? (
              <Loader2 size={13} className="animate-spin text-teal" />
            ) : (
              <Upload size={13} />
            )}
            {uploadState === "uploading" ? "Extracting skills…" : "Upload Resume (PDF/DOCX)"}
          </button>
        )}
        {uploadState === "error" && (
          <p className="text-xs text-red">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Upload Drop Zone */}
      {uploadState === "idle" || uploadState === "error" ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload your resume PDF or DOCX"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed p-8 transition-all ${
            isDragOver
              ? "border-teal bg-teal/5 scale-[1.01]"
              : "border-border bg-glass hover:border-teal/50 hover:bg-glass-hover"
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full border ${isDragOver ? "border-teal/50 bg-teal/10" : "border-border bg-bg"} transition-colors`}>
            <Upload size={20} className={isDragOver ? "text-teal" : "text-ink-faint"} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">
              {isDragOver ? "Drop your resume here" : "Upload your resume"}
            </p>
            <p className="mt-1 text-xs text-ink-dim">
              Drag & drop or click to browse · PDF or DOCX · Max 5 MB
            </p>
          </div>
          {uploadState === "error" && (
            <p className="mt-1 text-xs text-red">{errorMsg}</p>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <Sparkles size={11} className="text-teal" />
            <span>Skills extracted instantly — no scan delay</span>
          </div>
        </div>
      ) : uploadState === "uploading" ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-glass p-8 text-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border border-teal/20 bg-teal/5 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-teal" />
            </div>
            <span className="absolute -inset-1 animate-ping rounded-full border border-teal/20" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Extracting your skills…</p>
            <p className="mt-0.5 text-xs text-ink-dim">Reading resume content and detecting technologies</p>
          </div>
        </div>
      ) : (
        // Success state
        <div className="flex flex-col gap-3 rounded-card border border-teal/30 bg-teal/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-teal/30 bg-teal/10">
                <CheckCircle2 size={18} className="text-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Resume parsed successfully!</p>
                <p className="text-xs text-ink-dim">{lastResult?.summary}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="rounded-control p-1.5 text-ink-faint hover:text-ink hover:bg-glass-hover transition-colors"
              aria-label="Remove uploaded resume"
            >
              <X size={14} />
            </button>
          </div>

          {lastResult && lastResult.skills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-ink-dim">
                {lastResult.skills.length} skills detected:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lastResult.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-control border border-teal/25 bg-teal/10 px-2 py-0.5 text-xs font-mono text-teal"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lastResult && lastResult.detectedRoles.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-ink-dim">
              <FileText size={12} className="text-teal" />
              <span>Detected roles: {lastResult.detectedRoles.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
