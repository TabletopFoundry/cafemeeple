"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dice5,
  UtensilsCrossed,
  CalendarDays,
  PartyPopper,
  ArrowLeftRight,
  Home,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/games", label: "Game Library", icon: Dice5 },
  { href: "/admin/tables", label: "Tables & Sessions", icon: UtensilsCrossed },
  { href: "/admin/checkout", label: "Game Checkout", icon: ArrowLeftRight },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/events", label: "Events", icon: PartyPopper },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar-bg min-h-screen flex flex-col shrink-0" aria-label="Main navigation">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg">
          <span className="text-2xl" aria-hidden="true">☕</span>
          <span className="text-xl font-bold tracking-tight">CaféMeeple</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Admin sections">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-text hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sidebar-text hover:text-white text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-lg"
        >
          <Home size={16} aria-hidden="true" />
          Back to Site
        </Link>
      </div>
    </aside>
  );
}
