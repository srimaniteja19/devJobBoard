import { sendDailyReportsForNow } from "@/lib/daily-report/sendDailyReports";

async function main() {
  const result = await sendDailyReportsForNow();
  // eslint-disable-next-line no-console
  console.log("Daily report email result:", result);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Daily report email failed:", e);
  process.exit(1);
});

