"use client";

import { Badge } from "@/components/ui";
import { EventItem } from "@/lib/types";
import { CalendarDays, Edit2, Trash2, Users } from "lucide-react";

interface EventCardProps {
  event: EventItem;
  onViewRsvps: (event: EventItem) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (id: number) => void;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "upcoming":
      return "info" as const;
    case "completed":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    default:
      return "default" as const;
  }
};

export default function EventCard({ event, onViewRsvps, onEdit, onDelete }: EventCardProps) {
  const actualRsvps = event.actual_rsvps ?? 0;
  const fillPercent = event.capacity > 0 ? Math.round((actualRsvps / event.capacity) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
          <span className="text-xs text-gray-400 font-medium">{event.event_type}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{event.description}</p>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <CalendarDays size={14} />
            {new Date(event.event_date + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>
            {event.start_time} – {event.end_time}
          </span>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Users size={14} />
              {actualRsvps} / {event.capacity}
            </span>
            <span className="text-gray-500">{fillPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                fillPercent >= 90 ? "bg-red-500" : fillPercent >= 70 ? "bg-amber-500" : "bg-violet-500"
              }`}
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewRsvps(event)}
            className="flex-1 text-center px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
          >
            RSVPs
          </button>
          <button
            onClick={() => onEdit(event)}
            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label={`Edit ${event.title}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label={`Delete ${event.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
