"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSidebar, sidebarOpen]);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — hidden on mobile unless open */}
        <div
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role={sidebarOpen ? "dialog" : undefined}
          aria-modal={sidebarOpen ? "true" : undefined}
          aria-label={sidebarOpen ? "Admin navigation" : undefined}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeSidebar}
            className="absolute right-4 top-4 z-10 rounded-lg p-2 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
          <Sidebar onNavigate={closeSidebar} />
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile header with hamburger */}
          <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
            <button
              ref={menuButtonRef}
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
            >
              <Menu size={22} />
            </button>
            <span className="text-lg font-semibold text-gray-900">☕ CaféMeeple</span>
          </div>

          <main className="flex-1" role="main">
            <div className="p-6 lg:p-8 max-w-7xl">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
