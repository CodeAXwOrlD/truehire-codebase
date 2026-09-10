"use client";

import { Search } from "lucide-react";
import { UserMenu } from "@/components/ui/UserMenu";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-bg px-8 py-3.5">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
          }}
          className="flex items-center gap-2 rounded-control border border-border px-3 py-1.5 text-xs text-ink-faint transition-colors hover:border-border-strong hover:text-ink-dim"
        >
          <Search size={14} />
          Search
          <kbd className="ml-2 rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <UserMenu />
      </div>
    </header>
  );
}
