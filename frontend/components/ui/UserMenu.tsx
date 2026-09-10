"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { User, LogOut, LayoutDashboard, Briefcase, Sparkles, ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UserMenuProps {
  onOpenSkills?: () => void;
}

export function UserMenu({ onOpenSkills }: UserMenuProps) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="h-8 w-20 animate-pulse rounded-control bg-glass" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/sign-in">
          <Button variant="secondary" className="px-4 py-1.5 text-xs font-semibold">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="primary" className="px-4 py-1.5 text-xs font-semibold">
            Get Started
          </Button>
        </Link>
      </div>
    );
  }

  const isRecruiter = user.role === "recruiter";
  const initial = (user.email?.[0] || "U").toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-control border border-border bg-glass px-2.5 py-1.5 text-xs text-ink transition-all hover:border-teal hover:bg-glass-hover"
      >
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            isRecruiter ? "bg-amber/20 text-amber" : "bg-teal/20 text-teal"
          }`}
        >
          {initial}
        </div>
        <span className="max-w-[140px] truncate font-medium text-ink">
          {user.email.split("@")[0]}
        </span>
        <ChevronDown size={13} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-card border border-border bg-surface p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User Header */}
          <div className="border-b border-border/80 px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-ink">{user.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                  isRecruiter
                    ? "border border-amber/30 bg-amber/10 text-amber"
                    : "border border-teal/30 bg-teal/10 text-teal"
                }`}
              >
                {user.role}
              </span>
              <span className="text-[11px] text-ink-faint">Session Active</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-0.5 py-1.5 text-xs">
            {isRecruiter ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-control px-3 py-2 text-ink-dim hover:bg-glass-hover hover:text-ink transition-colors"
                >
                  <LayoutDashboard size={14} className="text-teal" />
                  <span>Recruiter Dashboard</span>
                </Link>
                <Link
                  href="/jobs"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-control px-3 py-2 text-ink-dim hover:bg-glass-hover hover:text-ink transition-colors"
                >
                  <Briefcase size={14} className="text-ink-faint" />
                  <span>Live Job Board</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/jobs"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-control px-3 py-2 text-ink-dim hover:bg-glass-hover hover:text-ink transition-colors"
                >
                  <Briefcase size={14} className="text-teal" />
                  <span>Verified Tech Jobs</span>
                </Link>
                {onOpenSkills && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      onOpenSkills();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-ink-dim hover:bg-glass-hover hover:text-ink transition-colors"
                  >
                    <Sparkles size={14} className="text-teal" />
                    <span>My Skills &amp; Match Config</span>
                  </button>
                )}
                <Link
                  href="/applications"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-control px-3 py-2 text-ink-dim hover:bg-glass-hover hover:text-ink transition-colors"
                >
                  <ShieldCheck size={14} className="text-ink-faint" />
                  <span>My Applications</span>
                </Link>
              </>
            )}
          </div>

          {/* Logout Action */}
          <div className="border-t border-border/80 pt-1.5">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-xs font-medium text-red hover:bg-red/10 transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
