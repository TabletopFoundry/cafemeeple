"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timer) => clearTimeout(timer));
      timeoutRefs.current.clear();
    };
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant = "error") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutRefs.current.delete(id);
    }, 5000);
    timeoutRefs.current.set(id, timer);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timeoutRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const errorToasts = toasts.filter((t) => t.variant === "error");
  const nonErrorToasts = toasts.filter((t) => t.variant !== "error");

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="assertive"
        aria-label="Error notifications"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      >
        {errorToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
        style={{ bottom: errorToasts.length > 0 ? `${errorToasts.length * 56 + 16}px` : "16px" }}
      >
        {nonErrorToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-600 text-white",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-right ${variantStyles[toast.variant]}`}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
