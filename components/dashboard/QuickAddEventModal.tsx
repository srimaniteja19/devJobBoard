"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { EVENT_LABELS, type EventType } from "@/types";
import { useToast } from "@/components/providers/ToastProvider";

const EVENT_TYPES = Object.keys(EVENT_LABELS) as EventType[];

function defaultDatetimeLocalValue(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  applicationId: string;
  company: string;
  open: boolean;
  onClose: () => void;
}

export default function QuickAddEventModal({
  applicationId,
  company,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState<string>("PHONE_SCREEN");
  const [scheduledAt, setScheduledAt] = useState(defaultDatetimeLocalValue);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setScheduledAt(defaultDatetimeLocalValue());
    setType("PHONE_SCREEN");
    setNotes("");
  }, [open, applicationId]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAt) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          scheduledAt: new Date(scheduledAt).toISOString(),
          notes: notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast(`Event added · ${company}`);
        onClose();
        router.refresh();
      } else {
        toast("Could not save event");
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-event-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md border border-edge bg-surface shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h2
            id="quick-add-event-title"
            className="text-[14px] font-medium text-t-primary"
          >
            Add event · {company}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-t-muted transition-theme hover:bg-bg hover:text-t-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full border border-edge bg-bg px-2 py-1.5 text-[13px] text-t-primary focus:border-accent focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVENT_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">
                When
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="mt-1 w-full border border-edge bg-bg px-2 py-1.5 text-[13px] text-t-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="mt-1 w-full border border-edge bg-bg px-2 py-1.5 text-[13px] text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[12px] font-light text-t-muted transition-theme hover:text-t-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 text-[12px] font-medium text-on-accent hover:bg-accent-hover disabled:opacity-50"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
