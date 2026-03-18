import cron from "node-cron";
import { sendDailyReportsForNow } from "@/lib/daily-report/sendDailyReports";
import { DEFAULT_REPORT_TIME_ZONE } from "@/lib/timezone";

const expression = "0 17 * * *"; // 5:00 PM daily

async function tick() {
  try {
    const result = await sendDailyReportsForNow();
    // eslint-disable-next-line no-console
    console.log(`[daily-report] Sent summary (${new Date().toISOString()}):`, result);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[daily-report] Tick failed:", e);
  }
}

async function main() {
  const runNow = process.env.DAILY_REPORT_RUN_IMMEDIATELY === "true";
  if (runNow) await tick();

  // Keep the process alive for the schedule.
  cron.schedule(expression, tick, {
    timezone: DEFAULT_REPORT_TIME_ZONE,
  });

  // eslint-disable-next-line no-console
  console.log(`[daily-report] Daemon started. Schedule: ${expression} (${DEFAULT_REPORT_TIME_ZONE})`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[daily-report] Failed to start:", e);
  process.exit(1);
});

