import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCalendarItems } from "@/lib/applications";
import InterviewCalendar from "@/components/calendar/InterviewCalendar";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const items = await getCalendarItems(user.id, start, end);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-[22px] font-medium text-t-primary sm:text-[28px]">
          Interview Calendar
        </h1>
        <p className="mt-1 text-[12px] font-light text-t-muted sm:text-[13px]">
          Follow-ups, interviews, and deadlines. Click a day to see what&apos;s due.
        </p>
      </div>

      <InterviewCalendar initialItems={items} />
    </div>
  );
}
