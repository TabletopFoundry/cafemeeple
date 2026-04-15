"use client";

import { useEffect, useState } from "react";
import { StatCard, LoadingSpinner, ErrorMessage, Badge } from "@/components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  today: {
    sessions: number;
    revenue: number;
    activeSessions: number;
    reservations: number;
    totalGames: number;
    gamesNeedingReplacement: number;
  };
  revenueByDay: { date: string; revenue: number; sessions: number }[];
  popularGames: { title: string; category: string; checkout_count: number }[];
  revenueByHour: { period: string; revenue: number; sessions: number }[];
  upcomingEvents: { id: number; title: string; event_date: string; rsvp_count: number; capacity: number }[];
  alerts: { type: string; message: string; severity: string }[];
}

const CHART_COLORS = ["#7c3aed", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <ErrorMessage message={error} onRetry={() => setRefreshKey((k) => k + 1)} />;
  if (!data) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                alert.severity === "warning"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <span>{alert.severity === "warning" ? "⚠️" : "ℹ️"}</span>
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Today's Revenue"
          value={`$${data.today.revenue.toFixed(2)}`}
          icon="💰"
          color="emerald"
        />
        <StatCard
          title="Active Sessions"
          value={data.today.activeSessions}
          icon="🪑"
          color="violet"
        />
        <StatCard
          title="Today's Reservations"
          value={data.today.reservations}
          icon="📅"
          color="blue"
        />
        <StatCard
          title="Total Games"
          value={data.today.totalGames}
          icon="🎲"
          color="amber"
          trend={data.today.gamesNeedingReplacement > 0 ? `${data.today.gamesNeedingReplacement} need replacement` : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (Last 7 Days)</h2>
          {data.revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val: string) => {
                    const d = new Date(val + "T12:00:00");
                    return d.toLocaleDateString("en-US", { weekday: "short" });
                  }}
                  fontSize={12}
                />
                <YAxis fontSize={12} tickFormatter={(val: number) => `$${val}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  labelFormatter={(label: string) => new Date(label + "T12:00:00").toLocaleDateString()}
                />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Revenue by Period */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Time Period</h2>
          {data.revenueByHour.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenueByHour}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ period, percent }: { period: string; percent: number }) =>
                    `${period} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="period"
                >
                  {data.revenueByHour.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              No revenue data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Games */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎲 Popular Games</h2>
          <div className="space-y-3">
            {data.popularGames.slice(0, 8).map((game, i) => (
              <div key={game.title} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-400 w-6">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{game.title}</p>
                    <p className="text-xs text-gray-500">{game.category}</p>
                  </div>
                </div>
                <Badge variant="info">{game.checkout_count} checkouts</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎉 Upcoming Events</h2>
          {data.upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {data.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.event_date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {event.rsvp_count}/{event.capacity}
                    </p>
                    <p className="text-xs text-gray-500">RSVPs</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No upcoming events</p>
          )}
        </div>
      </div>
    </div>
  );
}
