"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface Reminder {
  id: string;
  company: string;
  role: string;
  followUpDate: string;
}

export default function FollowUpReminders({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = now.getTime();
  const tomorrow = today + 86400000;

  return (
    <div
      className="mb-4 rounded-xl border p-3 sm:mb-6 sm:p-4"
      style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
    >
      <div className="mb-2 flex items-center gap-2 sm:mb-3">
        <AlertCircle className="h-3.5 w-3.5" style={{ color: "var(--dash-reminder-overdue)" }} />
        <h2 className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--dash-card-company)" }}>
          Due for Follow-up
        </h2>
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "var(--dash-reminder-badge-bg)", color: "var(--dash-reminder-overdue)" }}
        >
          {reminders.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {reminders.map((r) => {
          const [y, m, d] = r.followUpDate.split("-").map(Number);
          const dueDate = new Date(y, m - 1, d);
          dueDate.setHours(0, 0, 0, 0);
          const due = dueDate.getTime();
          let colorVar = "--dash-reminder-upcoming";
          let label = "Tomorrow";

          if (due < today) {
            const overdue = Math.ceil((today - due) / 86400000);
            colorVar = "--dash-reminder-overdue";
            label = `${overdue}d overdue`;
          } else if (due === today) {
            colorVar = "--dash-reminder-today";
            label = "Today";
          } else if (due === tomorrow) {
            colorVar = "--dash-reminder-upcoming";
            label = "Tomorrow";
          } else {
            const days = Math.ceil((due - today) / 86400000);
            colorVar = "--dash-reminder-upcoming";
            label = `In ${days}d`;
          }

          return (
            <Link
              key={r.id}
              href={`/applications/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-theme hover:opacity-80"
              style={{ outline: "none" }}
            >
              <div className="min-w-0">
                <span className="text-[13px] font-medium" style={{ color: "var(--dash-card-company)" }}>{r.company}</span>
                <span className="ml-2 text-[12px] font-light" style={{ color: "var(--dash-card-role)" }}>{r.role}</span>
              </div>
              <span className="shrink-0 text-[11px] font-medium" style={{ color: `var(${colorVar})` }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
