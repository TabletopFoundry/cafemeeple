"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, ErrorMessage, LoadingCard, StatCard } from "@/components/ui";
import type { DashboardData } from "@/lib/types";

const BREAKDOWN_COLORS = ["#7c3aed", "#06b6d4", "#f97316", "#10b981"];

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
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const json = (await response.json()) as DashboardData;
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => setRefreshKey((current) => current + 1)} />;
  }

  if (!data) {
    return (
      <ErrorMessage
        message="Dashboard data is unavailable. The server returned an empty response."
        onRetry={() => setRefreshKey((current) => current + 1)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today&apos;s floor pulse</h1>
          <p className="text-sm text-gray-500">
            Live operating metrics pulled from the seeded CaféMeeple data store.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((current) => current + 1)}
          className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Refresh dashboard
        </button>
      </div>

      {data.alerts.length > 0 && (
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <div
              key={`${alert.type}-${alert.message}`}
              className={`rounded-xl border px-4 py-3 text-sm ${
                alert.severity === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-blue-200 bg-blue-50 text-blue-900"
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tables active" value={data.today.activeTables} icon="🪑" color="violet" />
        <StatCard
          title="Games checked out"
          value={data.today.gamesCheckedOut}
          icon="🎲"
          color="amber"
        />
        <StatCard
          title="Revenue today"
          value={`$${data.today.revenue.toFixed(2)}`}
          icon="💸"
          color="emerald"
        />
        <StatCard title="Visitors today" value={data.today.visitors} icon="👥" color="blue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">30-day revenue mix</h2>
              <p className="text-sm text-gray-500">
                Cover charges versus F&amp;B, retail, and event-driven revenue.
              </p>
            </div>
            <Badge variant="info">Live</Badge>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueBreakdown} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} fontSize={12} />
                  <YAxis type="category" dataKey="category" width={110} fontSize={12} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                    {data.revenueBreakdown.map((entry, index) => (
                      <Cell key={entry.category} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.revenueBreakdown}
                    dataKey="value"
                    nameKey="category"
                    innerRadius={56}
                    outerRadius={96}
                    paddingAngle={3}
                  >
                    {data.revenueBreakdown.map((entry, index) => (
                      <Cell key={entry.category} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming events</h2>
            <p className="text-sm text-gray-500">Capacity and RSVP pressure for the next few events.</p>
          </div>
          <div className="space-y-4">
            {data.upcomingEvents.length > 0 ? (
              data.upcomingEvents.map((event) => {
                const fill = event.capacity > 0 ? Math.min(Math.round((event.actual_rsvps / event.capacity) * 100), 100) : 0;
                return (
                  <div key={event.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(`${event.event_date}T12:00:00`).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {" · "}
                          {event.event_type}
                        </p>
                      </div>
                      <Badge variant={fill >= 80 ? "warning" : "info"}>{fill}% full</Badge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-violet-600" style={{ width: `${fill}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {event.actual_rsvps} of {event.capacity} seats booked
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400">No upcoming events in the seeded calendar.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PopularGamesCard title="Popular this week" games={data.popularGamesWeek} emptyCopy="No checkouts in the last 7 days." />
        <PopularGamesCard title="Popular this month" games={data.popularGamesMonth} emptyCopy="No checkouts in the last 30 days." />
      </div>
    </div>
  );
}

function PopularGamesCard({
  title,
  games,
  emptyCopy,
}: {
  title: string;
  games: { title: string; category: string; checkout_count: number }[];
  emptyCopy: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">Track which library titles are driving repeat play.</p>
      </div>
      {games.length > 0 ? (
        <div className="space-y-3">
          {games.map((game, index) => (
            <div key={`${title}-${game.title}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{game.title}</p>
                  <p className="text-xs text-gray-500">{game.category}</p>
                </div>
              </div>
              <Badge variant="info">{game.checkout_count} checkouts</Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{emptyCopy}</p>
      )}
    </section>
  );
}
