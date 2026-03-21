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
};

// Design system: Dark Editorial · Monospace × Serif · Gold Accent
const COLORS = {
  bgPage: "#0f0f0f",
  bgCard: "#111111",
  bgCardHeader: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
  bgRowAlt: "#151515",
  bgRowHighlight: "#1a1500",
  bgFooter: "#0d0d0d",
  borderCard: "#2a2a2a",
  borderRow: "#1a1a1a",
  borderSection: "#222222",
  accentGold: "#f5c842",
  accentGoldMid: "#f0a500",
  accentGoldDeep: "#e07b00",
  accentGoldMuted: "#a08020",
  accentRed: "#ff5f5f",
  textPrimary: "#ffffff",
  textSecondary: "#cccccc",
  textTertiary: "#aaaaaa",
  textMuted: "#777777",
  textDim: "#555555",
  textGhost: "#444444",
  textFaint: "#333333",
};

const ACCENT_GRADIENT = "linear-gradient(90deg, #f5c842 0%, #f0a500 50%, #e07b00 100%)";
const SECTION_DIVIDER = "linear-gradient(90deg, #f5c842, #333333, transparent)";

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
    if (isNegative) return val > 0 ? COLORS.accentRed : COLORS.textMuted;
    return val > 0 ? COLORS.accentGold : "#888888";
  };

  const appliedRows = data.applied
    .map(
      (a, i) => `
      <tr>
        <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.company)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.role)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};text-align:right;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.appliedAtISO)}</td>
      </tr>
    `
    )
    .join("");

  const rejectedRows = data.rejected
    .map(
      (a, i) => `
      <tr>
        <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.company)}</td>
        <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.accentRed};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.role)}</td>
      </tr>
    `
    )
    .join("");

  const movedRows = Object.entries(data.moved)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([stage, apps]) =>
      apps.map(
        (a, i) => `
        <tr>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.accentGold};letter-spacing:1px;text-transform:uppercase;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(stage)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.company)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.accentGoldMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(a.role)}</td>
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
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(f.company)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(f.role)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(f.status)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};text-align:right;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(f.dueAtISO)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${prep}</td>
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
      const notes = e.notes ? `<div style="margin-top:6px;color:${COLORS.textDim};font-size:11px;">${escape(e.notes)}</div>` : "";
      return `
        <tr>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(e.eventLabel)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textSecondary};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(e.company)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textMuted};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(e.role)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};text-align:right;vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(e.scheduledAtISO)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${escape(e.status)}</td>
          <td style="padding:7px 6px;border-bottom:1px solid ${COLORS.borderRow};font-family:Georgia,serif;font-size:12px;color:${COLORS.textDim};vertical-align:top;"${i % 2 === 1 ? ` bgcolor="${COLORS.bgRowAlt}"` : ""}>${prep}${notes}</td>
        </tr>
      `;
    })
    .join("");

  const coachBlock = data.coachTitle
    ? `
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td style="padding:28px 40px 24px;">
            <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:${COLORS.textPrimary};line-height:1.3;margin-bottom:12px;">${escape(data.coachTitle)}</div>
            ${
              data.coachParagraphs?.length
                ? data.coachParagraphs.map((p) => `<p style="font-family:Georgia,serif;font-size:14px;color:${COLORS.textSecondary};line-height:1.6;margin:8px 0;">${escape(p)}</p>`).join("")
                : ""
            }
          </td>
        </tr>
      </table>
    `
    : "";

  const actionItems = (data.coachBullets ?? []).slice(0, 5);
  const actionItemRows = actionItems
    .map((bullet, idx) => {
      const isDeemph = idx === 4; // badge 5 is de-emphasized
      const badgeBg = isDeemph ? COLORS.textFaint : COLORS.accentGold;
      const badgeColor = isDeemph ? COLORS.accentGold : "#000000";
      const badgeBorder = isDeemph ? `border:1px solid ${COLORS.accentGold};` : "";
      const isLast = idx === actionItems.length - 1;
      return `
        <tr>
          <td style="padding:10px 0;vertical-align:middle;${!isLast ? `border-bottom:1px solid ${COLORS.borderRow};` : ""}">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="42" style="vertical-align:middle;">
                  <div style="width:28px;height:28px;border-radius:50%;background:${badgeBg};color:${badgeColor};font-family:'Courier New',monospace;font-size:11px;font-weight:700;text-align:center;line-height:28px;${badgeBorder}">${idx + 1}</div>
                </td>
                <td style="padding-left:14px;font-family:Georgia,serif;font-size:14px;color:${COLORS.textTertiary};line-height:1.6;vertical-align:middle;">${escape(bullet)}</td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

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
<body style="margin:0;padding:40px 16px;background:${COLORS.bgPage};color:${COLORS.textSecondary};font-family:Georgia,serif;font-size:16px;line-height:1.7;">
  <div style="font-size:1px;max-height:0;overflow:hidden;opacity:0;line-height:0;">${escape(preheader)}</div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;margin:0 auto;">
    <tr>
      <td>
        <!-- Accent Bar Top -->
        <div style="height:4px;background:${ACCENT_GRADIENT};border-radius:4px 4px 0 0;"></div>

        <!-- Card -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:620px;background:${COLORS.bgCard};border:1px solid ${COLORS.borderCard};border-top:none;border-radius:0 0 4px 4px;">
          <tr>
            <td>
              <!-- Header -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bgCardHeader};">
                <tr>
                  <td style="padding:36px 40px 28px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td>
                          <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">→ DAILY REPORT</div>
                          <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:34px;font-weight:700;color:${COLORS.textPrimary};line-height:1.15;letter-spacing:-0.5px;">
                            Daily <span style="color:${COLORS.accentGold};">Job Board</span> Report
                          </h1>
                          <div style="font-family:'Courier New',monospace;font-size:11px;color:${COLORS.textDim};letter-spacing:1px;">${escape(data.reportDateYMD)} · ${escape(formatMetadata(genDate))}</div>
                        </td>
                        <td align="right" valign="top" style="width:120px;">
                          <div style="font-family:Georgia,serif;font-size:72px;font-weight:700;color:${COLORS.accentGold};letter-spacing:-3px;line-height:1;">${data.applied.length}</div>
                          <div style="font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textDim};letter-spacing:2px;text-transform:uppercase;">APPLIED</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Stats Band -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:18px 0;text-align:center;border-right:1px solid ${COLORS.borderSection};border-top:1px solid ${COLORS.borderSection};border-bottom:1px solid ${COLORS.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(data.applied.length, false)};">${data.applied.length}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${COLORS.textGhost};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">APPLIED</div>
                  </td>
                  <td style="padding:18px 0;text-align:center;border-right:1px solid ${COLORS.borderSection};border-top:1px solid ${COLORS.borderSection};border-bottom:1px solid ${COLORS.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(data.rejected.length, true)};">${data.rejected.length}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${COLORS.textGhost};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">REJECTED</div>
                  </td>
                  <td style="padding:18px 0;text-align:center;border-right:1px solid ${COLORS.borderSection};border-top:1px solid ${COLORS.borderSection};border-bottom:1px solid ${COLORS.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(movedTotal, false)};">${movedTotal}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${COLORS.textGhost};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">MOVED</div>
                  </td>
                  <td style="padding:18px 0;text-align:center;border-top:1px solid ${COLORS.borderSection};border-bottom:1px solid ${COLORS.borderSection};width:25%;">
                    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${statColor(data.followUps.length + data.scheduledEvents.length, false)};">${data.followUps.length + data.scheduledEvents.length}</div>
                    <div style="font-family:'Courier New',monospace;font-size:9px;color:${COLORS.textGhost};letter-spacing:2px;text-transform:uppercase;margin-top:4px;">NEXT UP</div>
                  </td>
                </tr>
              </table>

              ${coachBlock ? `<!-- Momentum / Coach -->${coachBlock}` : ""}

              ${actionItems.length > 0 ? `
              <!-- Action Items -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 40px 16px;">
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ ACTION ITEMS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">${actionItemRows}</table>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- Section Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:${SECTION_DIVIDER};"></div>
                  </td>
                </tr>
              </table>

              <!-- Rejections Section -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:28px 40px 24px;">
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentRed};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✕ REJECTIONS</div>
                    ${data.rejected.length ? `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">ROLE</th>
                        </tr>
                      </thead>
                      <tbody>${rejectedRows}</tbody>
                    </table>
                    ` : `<div style="font-family:Georgia,serif;font-size:14px;color:${COLORS.textTertiary};">No applications marked as rejected today.</div>`}
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
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">→ APPLIED</div>
                    ${data.applied.length ? `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">ROLE</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">APPLIED</th>
                        </tr>
                      </thead>
                      <tbody>${appliedRows}</tbody>
                    </table>
                    ` : `<div style="font-family:Georgia,serif;font-size:14px;color:${COLORS.textTertiary};">No new applications marked as applied today.</div>`}
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
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ MOVED TO NEXT STEPS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">STAGE</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">ROLE</th>
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
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ FOLLOW-UPS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin-bottom:20px;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">ROLE</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">STATUS</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">DUE</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">PREP</th>
                        </tr>
                      </thead>
                      <tbody>${followUpRows}</tbody>
                    </table>
                    ` : ""}
                    ${data.scheduledEvents.length > 0 ? `
                    <div style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.accentGold};letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">✦ SCHEDULED EVENTS</div>
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">EVENT</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">COMPANY</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">ROLE</th>
                          <th align="right" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">WHEN</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">STATUS</th>
                          <th align="left" style="font-family:'Courier New',monospace;font-size:10px;font-weight:400;color:${COLORS.textGhost};letter-spacing:1px;text-transform:uppercase;padding-bottom:8px;border-bottom:1px solid ${COLORS.borderRow};">PREP</th>
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
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bgRowHighlight};border-left:3px solid ${COLORS.accentGold};border-radius:2px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <div style="font-family:'Courier New',monospace;font-size:10px;color:${COLORS.accentGold};letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">💡 TIP</div>
                          <div style="font-family:Georgia,serif;font-size:13px;color:#888888;line-height:1.6;">If a follow-up shows "Prep: Not generated yet", open the application and generate the prep once to get a better email draft tomorrow.</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer Band -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.bgFooter};border-top:1px solid ${COLORS.borderCard};">
                <tr>
                  <td style="padding:16px 40px;font-family:'Courier New',monospace;font-size:10px;color:${COLORS.textFaint};letter-spacing:1px;text-transform:uppercase;">
                    DEV JOB BOARD · ${escape(data.reportDateYMD)} · ET
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Accent Bar Bottom -->
        <div style="height:3px;background:${ACCENT_GRADIENT};border-radius:0 0 4px 4px;"></div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
