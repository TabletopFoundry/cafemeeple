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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar-bg min-h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="text-2xl">☕</span>
          <span className="text-xl font-bold tracking-tight">CaféMeeple</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-sidebar-text hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sidebar-text hover:text-white text-sm transition-colors"
        >
          <Home size={16} />
          Back to Site
        </Link>
      </div>
    </aside>
  );
}
