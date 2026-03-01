"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { EVENT_LABELS, type EventType } from "@/types";

const EVENT_TYPES = Object.keys(EVENT_LABELS) as EventType[];

interface AddEventFormProps {
  applicationId: string;
}

export default function AddEventForm({ applicationId }: AddEventFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("OTHER");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, scheduledAt, notes: notes || undefined }),
      });
      if (res.ok) {
        setOpen(false);
        setType("OTHER");
        setScheduledAt("");
        setNotes("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-theme hover:text-accent-hover"
      >
        <CalendarPlus className="h-3.5 w-3.5" />
        Add event
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-edge bg-bg p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full border border-edge bg-surface px-2 py-1.5 text-[13px] text-t-primary focus:border-accent focus:outline-none"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">Date</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="mt-1 w-full border border-edge bg-surface px-2 py-1.5 text-[13px] text-t-primary focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          className="mt-1 w-full border border-edge bg-surface px-2 py-1.5 text-[13px] text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="press inline-flex items-center gap-1 bg-accent px-3 py-1.5 text-[12px] font-medium text-bg hover:bg-accent-hover disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="press px-3 py-1.5 text-[12px] font-light text-t-muted transition-theme hover:text-t-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
