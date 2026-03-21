import { escape } from "@/lib/html";

export type AppRef = {
  company: string;
  role: string;
};

export type AppliedItem = AppRef & {
  appliedAtISO: string;
};

export type FollowUpItem = AppRef & {
  dueAtISO: string;
  status: string;
  prepSectionLabels: string[];
};

export type ScheduledEventItem = {
  scheduledAtISO: string;
  eventLabel: string;
  notes?: string | null;
  status: string;
  prepSectionLabels: string[];
} & AppRef;

export type RejectionSignal = "stack" | "domain" | "generic";
export type PatternDot = "red" | "gold" | "neutral";

export type RejectionAnalysisItem = AppRef & { signal: RejectionSignal };
export type RejectionPattern = { dot: PatternDot; body: string };

export type DailyReportEmailData = {
  reportDateYMD: string; // YYYY-MM-DD in ET
  generatedAtISO: string;
  applied: AppliedItem[];
  rejected: AppRef[];
  moved: Record<string, AppRef[]>; // stage -> apps
  followUps: FollowUpItem[];
  scheduledEvents: ScheduledEventItem[];
  coachTitle?: string;
  coachParagraphs?: string[];
  coachBullets?: string[];
  pullQuote?: string;
  sparklineData?: { day: string; label: string; count: number }[];
  weeklyTotal?: number;
  companyOfTheDay?: { company: string; role: string; isStretch?: boolean };
  rejectionAnalysis?: { items: RejectionAnalysisItem[]; patterns: RejectionPattern[] };
};

// Design system v2: Dark Editorial · Monospace × Serif · Gold Accent · Dry Wit
const C = {
  bgPage: "#0a0a0a",
  bgCard: "#111111",
  bgSpotlight: "#0d0d0d",
  bgAnalysis: "#0d0d0d",
  bgRowAlt: "#151515",
  bgRowHighlight: "#1a1500",
  bgPrepNote: "#111111",
  bgFooter: "#0d0d0d",
  borderCard: "#2a2a2a",
  borderSpotlight: "#2a2a2a",
  borderAnalysis: "#1e1e1e",
  borderRow: "#1a1a1a",
  borderSection: "#222222",
  borderActionRow: "#1e1e1e",
  accentGold: "#f5c842",
  accentGoldMid: "#f0a500",
  accentGoldDeep: "#e07b00",
  accentGoldMuted: "#a08020",
  accentRed: "#ff5f5f",
  dotRed: "#ff5f5f",
  dotGold: "#f5c842",
  dotNeutral: "#555555",
  textPrimary: "#ffffff",
  textSecondary: "#cccccc",
  textTertiary: "#aaaaaa",
  textMuted: "#888888",
  textDim: "#777777",
  textFaint: "#666666",
  textGhost: "#555555",
  textDead: "#444444",
  textFossil: "#333333",
};

const ACCENT_BAR_TOP = "linear-gradient(90deg, #f5c842 0%, #f0a500 50%, #e07b00 100%)";
const ACCENT_BAR_BOTTOM = "linear-gradient(90deg, #f5c842 0%, #e07b00 50%, #111 100%)";
const SECTION_DIVIDER = "linear-gradient(90deg, #f5c842, #333333, transparent)";
const SPOTLIGHT_MICRO = "linear-gradient(90deg, #f5c842, #e07b00, transparent)";

const STRETCH_COMPANIES = new Set(
  ["google", "meta", "facebook", "amazon", "apple", "microsoft", "netflix", "openai", "anthropic", "stripe", "figma", "notion", "linear", "vercel", "github", "spotify", "airbnb", "uber", "lyft", "salesforce", "adobe", "nvidia", "tesla", "coinbase", "square", "block", "twilio", "databricks", "snowflake", "mongodb", "elastic", "atlassian", "slack", "zoom", "dropbox", "box", "palantir"]
);

function isStretchCompany(company: string): boolean {
  return STRETCH_COMPANIES.has(company.trim().toLowerCase());
}

function formatMetadata(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} · ${h12}:${pad(m)} ${ampm} ET`;
}

export function renderDailyReportEmailHtml(data: DailyReportEmailData): {
  html: string;
  text: string;
} {
  const movedTotal = Object.values(data.moved).reduce((acc, apps) => acc + apps.length, 0);
  const genDate = new Date(data.generatedAtISO);

  const statColor = (val: number, isNegative: boolean) => {
    if (isNegative) return val > 0 ? C.accentRed : C.textMuted;
    return val > 0 ? C.accentGold : "#888888";
  };

  const appliedRows = data.applied
    .map((a, i) => {
      const highlight = isStretchCompany(a.company);
      const companyColor = highlight ? C.accentGold : C.textSecondary;
      const companyWeight = highlight ? "700" : "400";
      const roleColor = highlight ? C.accentGoldMuted : C.textDim;
      const rowBg = i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : "";
      return `
      <tr>
        <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;font-weight:${companyWeight};color:${companyColor};vertical-align:top;"${rowBg}>${escape(a.company)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${roleColor};vertical-align:top;"${rowBg}>${escape(a.role)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.textGhost};text-align:right;vertical-align:top;"${rowBg}>${escape(a.appliedAtISO)}</td>
      </tr>
    `;
    })
    .join("");

  const rejectionItems = data.rejectionAnalysis?.items ?? data.rejected.map((r) => ({ ...r, signal: "generic" as const }));
  const signalColor = (s: string) =>
    s === "stack" ? C.dotRed : s === "domain" ? C.dotGold : C.textMuted;
  const signalLabel = (s: string) =>
    s === "stack" ? "STACK" : s === "domain" ? "DOMAIN" : "—";

  const rejectedRows = rejectionItems
    .map((a, i) => {
      const rowBg = i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : "";
      return `
      <tr>
        <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textSecondary};vertical-align:top;"${rowBg}>${escape(a.company)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.accentRed};vertical-align:top;"${rowBg}>${escape(a.role)}</td>
        <td align="right" style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:9px;color:${signalColor(a.signal)};vertical-align:top;"${rowBg}>${signalLabel(a.signal)}</td>
      </tr>
    `;
    })
    .join("");

  const movedRows = Object.entries(data.moved)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([stage, apps]) =>
      apps.map(
        (a, i) => `
        <tr>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.accentGold};letter-spacing:1px;text-transform:uppercase;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(stage)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(a.company)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.accentGoldMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(a.role)}</td>
        </tr>
      `
      )
    )
    .join("");

  const followUpRows = data.followUps
    .map((f, i) => {
      const prep =
        f.prepSectionLabels.length > 0
          ? escape(f.prepSectionLabels.slice(0, 3).join(", "))
          : "Not generated yet";
      return `
        <tr>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(f.company)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(f.role)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(f.status)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.textDim};text-align:right;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(f.dueAtISO)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${prep}</td>
        </tr>
      `;
    })
    .join("");

  const scheduledEventRows = data.scheduledEvents
    .map((e, i) => {
      const prep =
        e.prepSectionLabels.length > 0
          ? escape(e.prepSectionLabels.slice(0, 3).join(", "))
          : "Not generated yet";
      const notes = e.notes ? `<div style="margin-top:6px;color:${C.textDim};font-size:11px;">${escape(e.notes)}</div>` : "";
      return `
        <tr>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(e.eventLabel)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(e.company)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(e.role)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.textDim};text-align:right;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(e.scheduledAtISO)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${C.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${escape(e.status)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${C.borderRow};font-family:Georgia,serif;font-size:12px;color:${C.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${C.bgRowAlt}"` : ""}>${prep}${notes}</td>
        </tr>
      `;
    })
    .join("");

  const appliedCount = data.applied.length;
  const rejectedCount = data.rejected.length;
  const pendingCount = Math.max(0, appliedCount - rejectedCount);
  const rejectedPct = appliedCount > 0 ? Math.round((rejectedCount / appliedCount) * 100) : 0;
  const pendingPct = appliedCount > 0 ? Math.round((pendingCount / appliedCount) * 100) : 0;

  const sparklineData = data.sparklineData ?? [];
  const maxSpark = Math.max(1, ...sparklineData.map((d) => d.count));
  const todayYMD = data.reportDateYMD;

  const text = [
    `Daily Job Board Report — ${data.reportDateYMD}`,
    "",
    `Applied: ${data.applied.length}`,
    ...data.applied.map((a) => `- ${a.company} — ${a.role} (Applied: ${a.appliedAtISO})`),
    "",
    `Rejected: ${data.rejected.length}`,
    ...data.rejected.map((a) => `- ${a.company} — ${a.role}`),
    "",
    `Moved:`,
    ...Object.entries(data.moved)
      .filter(([, apps]) => apps.length)
      .map(([stage, apps]) => `- ${stage}: ${apps.length}`),
    "",
    `Follow-ups: ${data.followUps.length}`,
    ...data.followUps.map((f) => `- ${f.company} — ${f.role} (Due: ${f.dueAtISO})`),
    "",
    `Scheduled events: ${data.scheduledEvents.length}`,
    ...data.scheduledEvents.map((e) => `- ${e.eventLabel}: ${e.company} — ${e.role} (When: ${e.scheduledAtISO})`),
  ].join("\n");

  const preheader = `Your daily job board summary · ${data.applied.length} applied · ${data.rejected.length} rejected`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Daily Job Board Report</title>
</head>
<body style="margin:0;padding:40px 16px;background:${C.bgPage};color:${C.textSecondary};font-family:Georgia,serif;font-size:16px;line-height:1.7;">
  <div style="font-size:1px;max-height:0;overflow:hidden;opacity:0;line-height:0;color:${C.bgPage};">${escape(preheader)}</div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;">
    <tr>
      <td>
        <!-- Accent Bar Top -->
        <div style="height:4px;background:${ACCENT_BAR_TOP};border-radius:4px 4px 0 0;"></div>

        <!-- Card -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:620px;background:${C.bgCard};border:1px solid ${C.borderCard};border-top:none;border-radius:0 0 4px 4px;">
          <tr>
            <td>
              <!-- Header -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);">
                <tr>
                  <td style="padding:36px 40px 28px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">→ DAILY REPORT</div>
                          <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:34px;font-weight:700;color:${C.textPrimary};line-height:1.15;letter-spacing:-0.5px;">
                            Daily <span style="color:${C.accentGold};">Job Board</span> Report
                          </h1>
                          ${data.pullQuote ? `<blockquote style="margin:12px 0 0;padding-left:12px;border-left:2px solid #333;font-family:Georgia,serif;font-size:13px;font-style:italic;color:${C.textGhost};line-height:1.5;">${escape(data.pullQuote)}</blockquote>` : ""}
                          <div style="margin-top:8px;font-family:'Courier New',monospace;font-size:11px;color:${C.textGhost};letter-spacing:1px;">${escape(data.reportDateYMD)} · ${escape(formatMetadata(genDate))}</div>
                        </td>
                        <td align="right" valign="top" style="width:120px;">
                          <div style="font-family:Georgia,serif;font-size:72px;font-weight:700;color:${C.accentGold};letter-spacing:-3px;line-height:1;">${appliedCount}</div>
                          <div style="font-family:'Courier New',monospace;font-size:10px;color:${C.textGhost};letter-spacing:2px;text-transform:uppercase;">APPLIED</div>
                          ${(data.weeklyTotal ?? 0) > 0 ? `<div style="margin-top:12px;font-family:Georgia,serif;font-size:18px;font-weight:400;color:${C.textMuted};letter-spacing:-1px;">${data.weeklyTotal}</div><div style="font-family:'Courier New',monospace;font-size:9px;color:${C.textDead};letter-spacing:1px;text-transform:uppercase;">WEEK</div>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Stats Band -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:18px 0;text-align:center;border-right:1px solid ${C.borderSection};border-top:1px solid ${C.borderSection};border-bottom:1px solid ${C.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(appliedCount, false)};">${appliedCount}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${C.textDead};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">APPLIED</div>
                  </td>
                  <td style="padding:18px 0;text-align:center;border-right:1px solid ${C.borderSection};border-top:1px solid ${C.borderSection};border-bottom:1px solid ${C.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(rejectedCount, true)};">${rejectedCount}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${C.textDead};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">REJECTED</div>
                  </td>
                  <td style="padding:18px 0;text-align:center;border-right:1px solid ${C.borderSection};border-top:1px solid ${C.borderSection};border-bottom:1px solid ${C.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(movedTotal, false)};">${movedTotal}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${C.textDead};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">MOVED</div>
                  </td>
                  <td style="padding:18px 0;text-align:center;border-top:1px solid ${C.borderSection};border-bottom:1px solid ${C.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(data.followUps.length + data.scheduledEvents.length, false)};">${data.followUps.length + data.scheduledEvents.length}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${C.textDead};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">NEXT UP</div>
                  </td>
                </tr>
              </table>

              <!-- Funnel Progress Bar -->
              ${appliedCount > 0 ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:16px 40px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius:2px;overflow:hidden;background:#222;">
                      <tr>
                        <td style="height:10px;width:${rejectedPct}%;background:${C.accentRed};"></td>
                        <td style="height:10px;width:${pendingPct}%;background:${C.accentGold};opacity:0.25;"></td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">
                      <tr>
                        <td style="font-family:'Courier New',monospace;font-size:9px;color:${C.accentRed};letter-spacing:1px;">${rejectedPct}% rejected</td>
                        <td align="right" style="font-family:'Courier New',monospace;font-size:9px;color:${C.accentGold};letter-spacing:1px;">${pendingPct}% pending</td>
                      </tr>
                    </table>
                    <div style="margin-top:6px;font-family:'Courier New',monospace;font-size:10px;color:${C.textDead};">Conversion: ${appliedCount} applied · <em style="color:${C.textFossil};">Funnel is alive. Barely.</em></div>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- 7-Day Sparkline -->
              ${sparklineData.length > 0 ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 40px;">
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textDead};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">⬛ 7-DAY APPLIED</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr valign="bottom">
                        ${sparklineData.map((d, i) => {
                          const isToday = d.day === todayYMD;
                          const h = maxSpark > 0 ? Math.max(4, Math.round((d.count / maxSpark) * 56)) : 4;
                          const barColor = d.count === 0 ? "#222" : isToday ? C.accentGold : d.count >= maxSpark * 0.5 ? "#555" : "#333";
                          const labelColor = isToday ? C.accentGold : C.textDead;
                          return `<td align="center" style="width:28px;padding-right:6px;vertical-align:bottom;">
                            <div style="height:${h}px;background:${barColor};border-radius:2px 2px 0 0;margin-bottom:4px;"></div>
                            <div style="font-family:'Courier New',monospace;font-size:8px;color:${labelColor};text-transform:uppercase;${isToday ? "font-weight:700;" : ""}">${escape(d.label)}</div>
                          </td>`;
                        }).join("")}
                        <td align="right" valign="bottom" style="padding-left:16px;">
                          <div style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:${C.textMuted};letter-spacing:-1px;">${data.weeklyTotal ?? 0}</div>
                          <div style="font-family:'Courier New',monospace;font-size:9px;color:${C.textDead};letter-spacing:1px;text-transform:uppercase;">WEEK</div>
                        </td>
                      </tr>
                      <tr><td colspan="8" style="border-bottom:1px solid #222;padding-top:4px;"></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Section Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:24px 40px 0;">
                    <div style="height:1px;background:${SECTION_DIVIDER};"></div>
                  </td>
                </tr>
              </table>

              <!-- Company of the Day Spotlight -->
              ${data.companyOfTheDay ? `
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:28px 40px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bgSpotlight};border:1px solid ${C.borderSpotlight};border-radius:3px;">
                      <tr>
                        <td>
                          <div style="height:2px;background:${SPOTLIGHT_MICRO};border-radius:3px 3px 0 0;"></div>
                          <table cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="padding:20px 24px;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                                  <td><div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">★ COMPANY OF THE DAY</div></td>
                                  ${data.companyOfTheDay.isStretch ? `<td align="right"><div style="background:${C.bgRowHighlight};border:1px solid ${C.accentGold};border-radius:2px;padding:4px 10px;font-family:'Courier New',monospace;font-size:9px;color:${C.accentGold};letter-spacing:2px;text-transform:uppercase;">STRETCH</div></td>` : "<td></td>"}
                                </tr></table>
                                <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:${C.accentGold};letter-spacing:-0.5px;">${escape(data.companyOfTheDay.company)}</div>
                                <div style="font-family:'Courier New',monospace;font-size:10px;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;margin-top:4px;">${escape(data.companyOfTheDay.role)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Section Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:${SECTION_DIVIDER};"></div>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Rejections Analysis -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentRed};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✕ REJECTIONS</div>
                    ${data.rejected.length ? `
                    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:12px;font-style:italic;color:#3a3a3a;">They said no. Science demands we ask why.</p>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textDead};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textDead};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">ROLE</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textDead};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">SIGNAL</th>
                        </tr>
                      </thead>
                      <tbody>${rejectedRows}</tbody>
                    </table>
                    ${(data.rejectionAnalysis?.patterns?.length ?? 0) > 0 ? `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:16px;background:${C.bgAnalysis};border:1px solid ${C.borderAnalysis};border-radius:2px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          ${(data.rejectionAnalysis?.patterns ?? []).map((p) => {
                            const dotColor = p.dot === "red" ? C.dotRed : p.dot === "gold" ? C.dotGold : C.dotNeutral;
                            return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;"><tr><td width="14" style="vertical-align:top;padding-top:4px;"><div style="width:6px;height:6px;border-radius:50%;background:${dotColor};"></div></td><td style="font-family:Georgia,serif;font-size:12px;color:${C.textFaint};line-height:1.6;">${escape(p.body)}</td></tr></table>`;
                          }).join("")}
                        </td>
                      </tr>
                    </table>
                    ` : ""}
                    ` : `<div style="font-family:Georgia,serif;font-size:14px;color:${C.textTertiary};">No applications marked as rejected today.</div>`}
                  </td>
                </tr>
              </table>

              <!-- Section Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:${SECTION_DIVIDER};"></div>
                  </td>
                </tr>
              </table>

              <!-- Applied Section -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">→ APPLIED</div>
                    ${data.applied.length ? `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">ROLE</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">APPLIED</th>
                        </tr>
                      </thead>
                      <tbody>${appliedRows}</tbody>
                    </table>
                    ` : `<div style="font-family:Georgia,serif;font-size:14px;color:${C.textTertiary};">No new applications marked as applied today.</div>`}
                  </td>
                </tr>
              </table>

              ${movedTotal ? `
              <!-- Section Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:${SECTION_DIVIDER};"></div>
                  </td>
                </tr>
              </table>

              <!-- Moved Section -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ MOVED TO NEXT STEPS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">STAGE</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">ROLE</th>
                        </tr>
                      </thead>
                      <tbody>${movedRows}</tbody>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ""}

              ${(data.followUps.length > 0 || data.scheduledEvents.length > 0) ? `
              <!-- Section Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:${SECTION_DIVIDER};"></div>
                  </td>
                </tr>
              </table>

              <!-- Follow-ups & Events -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    ${data.followUps.length > 0 ? `
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ FOLLOW-UPS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">ROLE</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">STATUS</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">DUE</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">PREP</th>
                        </tr>
                      </thead>
                      <tbody>${followUpRows}</tbody>
                    </table>
                    ` : ""}
                    ${data.scheduledEvents.length > 0 ? `
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ SCHEDULED EVENTS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">EVENT</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">ROLE</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">WHEN</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">STATUS</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${C.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${C.borderAnalysis};">PREP</th>
                        </tr>
                      </thead>
                      <tbody>${scheduledEventRows}</tbody>
                    </table>
                    ` : ""}
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Tip Block -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:24px 40px 32px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.bgRowHighlight};border-left:3px solid ${C.accentGold};border-radius:2px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <div style="font-family:'Courier New',monospace;font-size:10px;color:${C.accentGold};letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">💡 TIP</div>
                          <div style="font-family:Georgia,serif;font-size:13px;color:${C.textMuted};line-height:1.6;">If a follow-up shows "Prep: Not generated yet", open the application and generate it once — tomorrow's outreach draft will be significantly less embarrassing.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Accent Bar Bottom -->
        <div style="height:3px;background:${ACCENT_BAR_BOTTOM};border-radius:0 0 4px 4px;"></div>

        <!-- Footer Band -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:${C.bgFooter};">
          <tr>
            <td style="padding:16px 40px;font-family:'Courier New',monospace;font-size:10px;color:${C.textFossil};letter-spacing:1px;text-transform:uppercase;">
              DEV JOB BOARD · ${escape(data.reportDateYMD)} · ET
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
