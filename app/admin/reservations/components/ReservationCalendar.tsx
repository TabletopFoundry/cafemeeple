"use client";

import { Badge, EmptyState } from "@/components/ui";
import type { Reservation } from "@/lib/types";

type CalendarReservation = Pick<
  Reservation,
  | "id"
  | "guest_name"
  | "party_size"
  | "reservation_date"
  | "reservation_time"
  | "duration_minutes"
  | "status"
> & {
  table_name: string | null;
};

type StatusVariant = "success" | "warning" | "danger" | "info" | "default";

interface ReservationCalendarProps {
  reservations: CalendarReservation[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  statusVariant: (status: string) => StatusVariant;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

function getWeekDates(selectedDate: string): string[] {
  const date = new Date(selectedDate + "T12:00:00");
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function ReservationCalendar({
  reservations,
  selectedDate,
  onSelectDate,
  statusVariant,
  hasActiveFilters,
  onResetFilters,
}: ReservationCalendarProps) {
  const weekDates = getWeekDates(selectedDate);
  const selectedReservations = reservations.filter((reservation) => reservation.reservation_date === selectedDate);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDates.map((date) => {
          const isToday = date === new Date().toISOString().slice(0, 10);
          const isSelected = date === selectedDate;
          const dateReservations = reservations.filter((r) => r.reservation_date === date);
          return (
            <button
              key={date}
              onClick={() => onSelectDate(date)}
              className={`p-3 text-center border-r last:border-r-0 transition-colors ${
                isSelected ? "bg-violet-50" : "hover:bg-gray-50"
              }`}
            >
              <p className="text-xs text-gray-500">
                {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className={`text-lg font-semibold ${isToday ? "text-violet-600" : "text-gray-900"}`}>
                {new Date(date + "T12:00:00").getDate()}
              </p>
              {dateReservations.length > 0 && (
                <div className="mt-1">
                  <Badge variant="info">{dateReservations.length}</Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm text-gray-700 mb-3">
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>
        {selectedReservations.length === 0 ? (
          <EmptyState
            icon="📅"
            title={hasActiveFilters ? "No reservations match the selected filters" : "No reservations for this date"}
            description={
              hasActiveFilters
                ? "Try another day or reset the active filters to reopen the schedule."
                : "Pick another date in the week strip or create a new reservation."
            }
            action={hasActiveFilters ? (
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Reset filters
              </button>
            ) : undefined}
          />
        ) : (
          <div className="space-y-2">
            {selectedReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">
                      {r.reservation_time} — {r.guest_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {r.party_size} guests · {r.table_name || "No table"} · {r.duration_minutes}min
                    </p>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
