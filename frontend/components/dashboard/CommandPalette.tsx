"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, LayoutDashboard, BarChart3 } from "lucide-react";

interface Command {
  label: string;
  href: string;
  icon: typeof Search;
}

const COMMANDS: Command[] = [
  { label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Go to Requisitions", href: "/dashboard/requisitions", icon: Briefcase },
  { label: "Go to Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!open) return null;

  const filtered = COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-card border border-border-strong bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search size={16} className="text-ink-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs text-ink-faint">Esc</kbd>
        </div>

        <ul className="max-h-72 overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-ink-faint">No results</li>
          )}
          {filtered.map((c) => {
            const Icon = c.icon;
            return (
              <li key={c.href}>
                <button
                  onClick={() => go(c.href)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-dim transition-colors hover:bg-glass-hover hover:text-ink"
                >
                  <Icon size={15} />
                  {c.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
