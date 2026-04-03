import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getScheduleWindow } from "@/lib/schedule";
import ScheduleBoard from "@/components/schedule/ScheduleBoard";
import { Calendar } from "lucide-react";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const items = await getScheduleWindow(user.id, {
    pastDays: 1,
    futureDays: 56,
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <div className="schedule-shell px-5 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-[24px] font-medium tracking-tight text-t-primary sm:text-[32px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Schedule
            </h1>
            <p
              className="mt-2 max-w-lg text-[12px] font-light leading-relaxed text-t-muted sm:text-[13px]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Frosted cards on a soft pastel backdrop—each interview type has its
              own gentle tint so you can scan your week without the noise.
            </p>
          </div>
          <Link
            href="/calendar"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-white/60 bg-white/40 px-4 py-2.5 text-[12px] font-medium text-t-primary shadow-sm backdrop-blur-md transition-all hover:bg-white/55 dark:border-white/12 dark:bg-white/10 dark:hover:bg-white/[0.14]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            <Calendar className="h-4 w-4 opacity-80" />
            Month view
          </Link>
        </div>

        <ScheduleBoard initialItems={items} />
      </div>
    </div>
  );
}
