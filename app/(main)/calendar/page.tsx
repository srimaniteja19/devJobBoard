import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getCalendarItems } from "@/lib/applications";
import InterviewCalendar from "@/components/calendar/InterviewCalendar";
import DownloadWeekPacketButton from "@/components/calendar/DownloadWeekPacketButton";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const items = await getCalendarItems(user.id, start, end);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-medium text-t-primary sm:text-[28px]">
            Interview Calendar
          </h1>
          <p className="mt-1 text-[12px] font-light text-t-muted sm:text-[13px]">
            Follow-ups, interviews, and deadlines. Click a day to see what&apos;s
            due.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DownloadWeekPacketButton />
          <Link
            href="/schedule"
            className="inline-flex shrink-0 items-center gap-2 border border-edge bg-surface px-3 py-2 text-[12px] font-medium text-t-muted transition-theme hover:border-accent/50 hover:text-t-primary"
          >
            <CalendarClock className="h-4 w-4" />
            Timeline view
          </Link>
        </div>
      </div>

      <InterviewCalendar initialItems={items} />
    </div>
  );
}
