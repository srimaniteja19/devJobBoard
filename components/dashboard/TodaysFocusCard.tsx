"use client";

import Link from "next/link";
import { Target, Mail, Plus, Zap, Briefcase } from "lucide-react";
import DailyInspiration from "./DailyInspiration";

interface Reminder {
  id: string;
  company: string;
  role: string;
  followUpDate: string;
}

interface TodaysFocusCardProps {
  reminders: Reminder[];
  streak: number;
  appliedToday: number;
  total: number;
}

export default function TodaysFocusCard({ reminders, streak, appliedToday, total }: TodaysFocusCardProps) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const today = now.getTime();
  const overdue = reminders.filter((r) => {
    const [y, m, d] = r.followUpDate.split("-").map(Number);
    return new Date(y, m - 1, d).getTime() < today;
  });
  const dueToday = reminders.filter((r) => {
    const [y, m, d] = r.followUpDate.split("-").map(Number);
    return new Date(y, m - 1, d).getTime() === today;
  });

  let action: { icon: React.ReactNode; title: string; subtitle: string; href?: string } | null = null;

  if (overdue.length > 0) {
    action = {
      icon: <Mail className="h-5 w-5" />,
      title: `Follow up with ${overdue[0].company}`,
      subtitle: `${overdue.length} overdue — don't let them go cold`,
      href: `/applications/${overdue[0].id}`,
    };
  } else if (dueToday.length > 0) {
    action = {
      icon: <Mail className="h-5 w-5" />,
      title: `Follow up with ${dueToday[0].company}`,
      subtitle: "Due today",
      href: `/applications/${dueToday[0].id}`,
    };
  } else if (streak === 0 && appliedToday === 0) {
    action = {
      icon: <Zap className="h-5 w-5" />,
      title: "Apply to 1+ companies today",
      subtitle: "Start or maintain your streak",
      href: "/applications?add=1",
    };
  } else if (total === 0) {
    action = {
      icon: <Plus className="h-5 w-5" />,
      title: "Add your first application",
      subtitle: "Track your job search",
      href: "/applications?add=1",
    };
  } else {
    action = {
      icon: <Briefcase className="h-5 w-5" />,
      title: "Keep the momentum",
      subtitle: streak > 0 ? `${streak}-day streak — apply today to keep it` : "Add another application",
      href: "/applications?add=1",
    };
  }

  const isKeepMomentum = action?.title === "Keep the momentum";

  if (!action) return null;

  const content = (
    <div className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent"
      >
        {action.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold" style={{ color: "var(--dash-card-company)" }}>
          {action.title}
        </p>
        <p className="mt-0.5 text-[12px]" style={{ color: "var(--dash-column-text)" }}>
          {action.subtitle}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="overflow-hidden rounded-2xl border-2 shadow-md"
      style={{
        backgroundColor: "var(--dash-card-bg)",
        borderColor: "var(--dash-stat-applied)",
      }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--dash-card-border)" }}>
        <Target className="h-4 w-4" style={{ color: "var(--dash-stat-applied)" }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-stat-applied)" }}>
          Today&apos;s focus
        </span>
      </div>
      <div className="p-4">
        {action.href ? (
          <Link href={action.href} className="block transition-opacity hover:opacity-90">
            {content}
          </Link>
        ) : (
          content
        )}
        {isKeepMomentum && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--dash-card-border)" }}>
            <DailyInspiration />
          </div>
        )}
      </div>
    </div>
  );
}
