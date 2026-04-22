/**
 * Shared UI primitives used across the admin dashboard.
 *
 * These are simple, reusable presentational components — spinners, empty
 * states, stat cards, badges, etc. They carry no domain logic.
 *
 * @module ui
 */

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };
  return (
    <div className="flex justify-center items-center p-8" role="status" aria-label="Loading">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-violet-600`}
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Skeleton placeholder card shown while content is loading. */
export function LoadingCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse" aria-hidden="true">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

/** Friendly placeholder shown when a list or section has no data. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4" aria-hidden="true">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action}
    </div>
  );
}

/** Inline error message with an optional retry button. */
export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700" role="alert">
      <p className="font-medium">Error</p>
      <p className="text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/** Key metric card used on the admin dashboard. */
export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "violet",
}: {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: "violet" | "emerald" | "amber" | "blue" | "red";
}) {
  const colorClasses = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-500",
    amber: "bg-amber-50 text-amber-500",
    blue: "bg-blue-50 text-blue-500",
    red: "bg-red-50 text-red-500",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <span className={`text-xl p-2 rounded-lg ${colorClasses[color]}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {trend && <p className="text-sm text-gray-500 mt-1">{trend}</p>}
    </div>
  );
}

/** Small coloured pill for status indicators, categories, etc. */
export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-50 text-emerald-500",
    warning: "bg-amber-50 text-amber-500",
    danger: "bg-red-50 text-red-500",
    info: "bg-blue-50 text-blue-500",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
