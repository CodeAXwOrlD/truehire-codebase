"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, BarChart3, LogOut } from "lucide-react";
import { VerifiedBeacon } from "@/components/brand/VerifiedBeacon";
import { logout } from "@/lib/api/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/requisitions", label: "Requisitions", icon: Briefcase },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const containerRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ top: number; height: number; opacity: number }>({
    top: 0,
    height: 0,
    opacity: 0,
  });

  function handleMouseEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    const container = containerRef.current;
    if (!container) return;
    const itemRect = e.currentTarget.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setIndicator({
      top: itemRect.top - containerRect.top,
      height: itemRect.height,
      opacity: 1,
    });
  }

  function handleMouseLeave() {
    setIndicator((prev) => ({ ...prev, opacity: 0 }));
  }

  async function handleLogout() {
    await logout();
    router.push("/sign-in");
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-5 py-5">
        <VerifiedBeacon size={24} animate={false} />
        <span className="text-sm font-bold text-ink">
          True<span className="text-teal">Hire</span>
        </span>
      </div>

      <nav ref={containerRef} className="relative flex-1 px-3 py-2" onMouseLeave={handleMouseLeave}>
        <div
          className="absolute left-3 right-3 rounded-control bg-glass-hover transition-all duration-200 ease-out"
          style={{ top: indicator.top, height: indicator.height, opacity: indicator.opacity }}
        />

        <ul className="relative flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onMouseEnter={handleMouseEnter}
                  className={`relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors ${
                    active ? "text-ink" : "text-ink-dim hover:text-ink"
                  }`}
                >
                  <Icon size={16} strokeWidth={2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm text-ink-dim transition-colors hover:text-ink"
        >
          <LogOut size={16} strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}
