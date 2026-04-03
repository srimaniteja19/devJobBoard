import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getScheduleWindow } from "@/lib/schedule";
import { getScheduleDemoItems } from "@/lib/schedule-demo";
import ScheduleBoard from "@/components/schedule/ScheduleBoard";
import { Calendar } from "lucide-react";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { demo?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const demo = searchParams.demo;
  const items =
    demo === "1"
      ? getScheduleDemoItems()
      : await getScheduleWindow(user.id, {
          pastDays: 1,
          futureDays: 56,
        });

  const sans = { fontFamily: "'DM Sans', sans-serif" } as const;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <div className="schedule-shell overflow-hidden rounded-3xl">
        <div className="schedule-page-pastel rounded-3xl border border-white/50 bg-white/25 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 sm:text-[28px]">
                Schedule
              </h1>
              <p
                className="mt-2 max-w-lg text-[12px] font-light leading-relaxed text-zinc-600 sm:text-[13px]"
                style={sans}
              >
                Profile-style cards: solid color blocks, monospace titles, and
                pastel mesh behind frosted glass.{" "}
                {demo === "1" ? (
                  <Link
                    href="/schedule"
                    className="font-medium text-emerald-800 underline-offset-2 hover:underline"
                  >
                    Exit demo
                  </Link>
                ) : (
                  <>
                    Try{" "}
                    <Link
                      href="/schedule?demo=1"
                      className="font-medium text-emerald-800 underline-offset-2 hover:underline"
                    >
                      sample events
                    </Link>
                    .
                  </>
                )}
              </p>
            </div>
            <Link
              href="/calendar"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-[12px] font-medium text-zinc-900 shadow-md ring-1 ring-zinc-200/80 transition-all hover:shadow-lg"
              style={sans}
            >
              <Calendar className="h-4 w-4 opacity-80" />
              Month view
            </Link>
          </div>

          <ScheduleBoard initialItems={items} />
        </div>
      </div>
    </div>
  );
}
