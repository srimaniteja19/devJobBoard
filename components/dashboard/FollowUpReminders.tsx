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
    <div className="mb-4 border border-edge bg-surface p-3 sm:mb-6 sm:p-4">
      <div className="mb-2 flex items-center gap-2 sm:mb-3">
        <AlertCircle className="h-3.5 w-3.5 text-[#f87171]" />
        <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-primary">
          Due for Follow-up
        </h2>
        <span className="bg-[#f8717130] px-1.5 py-0.5 text-[10px] font-medium text-[#f87171]">
          {reminders.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {reminders.map((r) => {
          const due = new Date(r.followUpDate).getTime();
          let color = "#e8ff47";
          let label = "Tomorrow";

          if (due < today) {
            const overdue = Math.ceil((today - due) / 86400000);
            color = "#f87171";
            label = `${overdue}d overdue`;
          } else if (due === today) {
            color = "#fb923c";
            label = "Today";
          }

          return (
            <Link
              key={r.id}
              href={`/applications/${r.id}`}
              className="flex items-center justify-between gap-3 px-2 py-1.5 transition-theme hover:bg-bg"
            >
              <div className="min-w-0">
                <span className="text-[13px] font-medium text-t-primary">{r.company}</span>
                <span className="ml-2 text-[12px] font-light text-[#777]">{r.role}</span>
              </div>
              <span className="shrink-0 text-[11px] font-medium" style={{ color }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
