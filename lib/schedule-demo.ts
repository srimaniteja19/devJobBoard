import { addDays, format } from "date-fns";
import type { CalendarItem } from "@/lib/applications";

/**
 * Sample events for `?demo=1` — three types across two days (design preview).
 */
export function getScheduleDemoItems(): CalendarItem[] {
  const today = new Date();
  const day1 = format(addDays(today, 2), "yyyy-MM-dd");
  const day2 = format(addDays(today, 5), "yyyy-MM-dd");

  const start0 = new Date(`${day1}T09:00:00`);
  const end0 = new Date(start0.getTime() + 60 * 60 * 1000);
  const start1 = new Date(`${day1}T14:00:00`);
  const end1 = new Date(start1.getTime() + 60 * 60 * 1000);
  const start2 = new Date(`${day1}T16:30:00`);
  const end2 = new Date(start2.getTime() + 60 * 60 * 1000);
  const start3 = new Date(`${day2}T10:00:00`);
  const end3 = new Date(start3.getTime() + 90 * 60 * 1000);

  return [
    {
      id: "demo-reminder",
      type: "follow_up",
      date: day1,
      startAt: start0.toISOString(),
      endAt: end0.toISOString(),
      title: "Follow up: Lumen AI",
      subtitle: "Senior Backend Engineer",
      applicationId: "demo",
      status: "APPLIED",
    },
    {
      id: "demo-technical",
      type: "event",
      date: day1,
      startAt: start1.toISOString(),
      endAt: end1.toISOString(),
      title: "Technical Interview: Northwind Labs",
      subtitle: "Staff Software Engineer",
      applicationId: "demo",
      status: "INTERVIEW",
      eventType: "TECHNICAL",
    },
    {
      id: "demo-phone",
      type: "event",
      date: day1,
      startAt: start2.toISOString(),
      endAt: end2.toISOString(),
      title: "Phone Screen: Harbor Co",
      subtitle: "Product Engineer",
      applicationId: "demo",
      status: "SCREENING",
      eventType: "PHONE_SCREEN",
    },
    {
      id: "demo-behavioral",
      type: "event",
      date: day2,
      startAt: start3.toISOString(),
      endAt: end3.toISOString(),
      title: "Behavioral Interview: Meridian",
      subtitle: "Engineering Manager track",
      applicationId: "demo",
      status: "INTERVIEW",
      eventType: "BEHAVIORAL",
    },
  ];
}
