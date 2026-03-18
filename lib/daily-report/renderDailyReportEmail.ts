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

export function renderDailyReportEmailHtml(data: DailyReportEmailData): {
  html: string;
  text: string;
} {
  const movedTotal = Object.values(data.moved).reduce((acc, apps) => acc + apps.length, 0);

  const stageColor = (stage: string) => {
    if (stage === "SCREENING") return "#fbbf24";
    if (stage === "INTERVIEW") return "#fb923c";
    if (stage === "OFFER") return "#e8ff47";
    return "#a78bfa";
  };

  const appliedRows = data.applied
    .map(
      (a) => `
      <tr>
        <td>${escape(a.company)}</td>
        <td class="role">${escape(a.role)}</td>
        <td class="muted">${escape(a.appliedAtISO)}</td>
      </tr>
    `
    )
    .join("");

  const rejectedRows = data.rejected
    .map(
      (a) => `
      <tr>
        <td>${escape(a.company)}</td>
        <td class="role rejected-role">${escape(a.role)}</td>
      </tr>
    `
    )
    .join("");

  const movedRows = Object.entries(data.moved)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([stage, apps]) =>
      apps.map(
        (a) => `
        <tr>
          <td class="stage" style="color:${stageColor(stage)};">${escape(stage)}</td>
          <td>${escape(a.company)}</td>
          <td class="role">${escape(a.role)}</td>
        </tr>
      `
      )
    )
    .join("");

  const followUpRows = data.followUps
    .map((f) => {
      const prep =
        f.prepSectionLabels.length > 0
          ? escape(f.prepSectionLabels.slice(0, 3).join(", "))
          : "Not generated yet";
      return `
        <tr>
          <td>${escape(f.company)}</td>
          <td class="role">${escape(f.role)}</td>
          <td class="muted">${escape(f.status)}</td>
          <td class="muted">${escape(f.dueAtISO)}</td>
          <td class="muted">${prep}</td>
        </tr>
      `;
    })
    .join("");

  const scheduledEventRows = data.scheduledEvents
    .map((e) => {
      const prep =
        e.prepSectionLabels.length > 0
          ? escape(e.prepSectionLabels.slice(0, 3).join(", "))
          : "Not generated yet";
      const notes = e.notes ? `<div class="notes">${escape(e.notes)}</div>` : "";
      return `
        <tr>
          <td class="muted">${escape(e.eventLabel)}</td>
          <td>${escape(e.company)}</td>
          <td class="role">${escape(e.role)}</td>
          <td class="muted">${escape(e.scheduledAtISO)}</td>
          <td class="muted">${escape(e.status)}</td>
          <td class="muted">${prep}${notes}</td>
        </tr>
      `;
    })
    .join("");

  const coachBlock = data.coachTitle
    ? `
      <table class="card">
        <tr>
          <td class="hero">
            <div class="hero-title">${escape(data.coachTitle)}</div>
            ${
              data.coachParagraphs?.length
                ? `<div class="hero-body">${data.coachParagraphs.map((p) => `<p>${escape(p)}</p>`).join("")}</div>`
                : ""
            }
            ${
              data.coachBullets?.length
                ? `<ul class="hero-bullets">${data.coachBullets.slice(0, 5).map((b) => `<li>${escape(b)}</li>`).join("")}</ul>`
                : ""
            }
          </td>
        </tr>
      </table>
    `
    : "";

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

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Daily Job Board Report</title>
    </head>
    <body style="margin:0;padding:0;background:#f6f7ff;color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';">
      <div style="max-width:760px;margin:0 auto;padding:22px;">
        <div class="header">
          <div class="header-row">
            <div class="dot"></div>
            <div class="header-title">Daily Job Board Report</div>
          </div>
          <div class="header-sub">
            Date: <b>${escape(data.reportDateYMD)}</b> • Generated: <span>${escape(new Date(data.generatedAtISO).toISOString())}</span>
          </div>
        </div>

        <div style="height:14px;"></div>
        ${coachBlock}

        <div style="height:14px;"></div>

        <div class="two">
          <table class="card">
            <tr><td class="card-title">
              Applied <span class="count">${data.applied.length}</span>
            </td></tr>
            <tr>
              <td>
                ${
                  data.applied.length
                    ? `<table class="tbl">
                        <thead>
                          <tr><th>Company</th><th>Role</th><th>Applied</th></tr>
                        </thead>
                        <tbody>${appliedRows}</tbody>
                      </table>`
                    : `<div class="muted">No new applications marked as applied.</div>`
                }
              </td>
            </tr>
          </table>

          <table class="card">
            <tr><td class="card-title">
              Rejected <span class="count rejected">${data.rejected.length}</span>
            </td></tr>
            <tr>
              <td>
                ${
                  data.rejected.length
                    ? `<table class="tbl">
                        <thead>
                          <tr><th>Company</th><th>Role</th></tr>
                        </thead>
                        <tbody>${rejectedRows}</tbody>
                      </table>`
                    : `<div class="muted">No applications marked as rejected.</div>`
                }
              </td>
            </tr>
          </table>
        </div>

        <div style="height:14px;"></div>
        <div class="section-title">Moved to Next Steps <span class="count muted-count">${movedTotal}</span></div>
        ${
          movedTotal
            ? `<table class="card">
                <tr><td>
                  <table class="tbl">
                    <thead>
                      <tr><th>Stage</th><th>Company</th><th>Role</th></tr>
                    </thead>
                    <tbody>${movedRows}</tbody>
                  </table>
                </td></tr>
              </table>`
            : `<div class="muted">No stage transitions into Screening/Interview/Offer today.</div>`
        }

        <div style="height:14px;"></div>
        <div class="section-title">Follow-ups & Events (Next Window)</div>
        <div class="two">
          <table class="card">
            <tr><td class="card-title">Follow-up Reminders</td></tr>
            <tr><td>
              ${
                data.followUps.length
                  ? `<table class="tbl">
                      <thead>
                        <tr><th>Company</th><th>Role</th><th>Status</th><th>Due</th><th>Prep</th></tr>
                      </thead>
                      <tbody>${followUpRows}</tbody>
                    </table>`
                  : `<div class="muted">No follow-up reminders due in the next window.</div>`
              }
            </td></tr>
          </table>

          <table class="card">
            <tr><td class="card-title">Scheduled Events</td></tr>
            <tr><td>
              ${
                data.scheduledEvents.length
                  ? `<table class="tbl">
                      <thead>
                        <tr><th>Event</th><th>Company</th><th>Role</th><th>When</th><th>Status</th><th>Prep</th></tr>
                      </thead>
                      <tbody>${scheduledEventRows}</tbody>
                    </table>`
                  : `<div class="muted">No scheduled events in the next window.</div>`
              }
            </td></tr>
          </table>
        </div>

        <div style="height:12px;"></div>
        <div class="tip">
          Tip: If a follow-up shows “Prep: Not generated yet”, open the application and generate the prep once to get a better email draft tomorrow.
        </div>
      </div>

      <style>
        .header { padding:16px 18px; border-radius:16px; background:linear-gradient(135deg,#dbeafe,#fef3c7); border:1px solid rgba(17,24,39,0.06); }
        .header-row { display:flex; align-items:center; gap:12px; }
        .dot { width:12px; height:12px; border-radius:999px; background:#60a5fa; box-shadow:0 0 0 4px rgba(96,165,250,0.25); }
        .header-title { font-size:18px; font-weight:800; letter-spacing:-0.01em; color:#111827; }
        .header-sub { margin-top:6px; font-size:13px; color:#374151; }

        .two { display:block; }

        .card { width:100%; border:1px solid rgba(17,24,39,0.08); background:#ffffff; border-radius:16px; padding:14px; border-collapse:separate; }
        .hero { background:linear-gradient(135deg, rgba(52,211,153,0.18), rgba(59,130,246,0.16)); border-radius:16px; padding:16px; }
        .hero-title { font-weight:900; color:#0f172a; margin-bottom:8px; }
        .hero-body p { margin:8px 0; color:#0f172a; }
        .hero-bullets { padding-left:18px; margin:10px 0 0; }
        .hero-bullets li { margin:6px 0; color:#0f172a; }

        .card-title { font-weight:900; letter-spacing:-0.01em; color:#0f172a; padding-bottom:10px; }
        .count { font-size:20px; font-weight:900; color:#111827; margin-left:8px; }
        .rejected { color:#fb7185; }

        .tbl { width:100%; border-collapse:collapse; }
        .tbl th { text-align:left; font-size:12px; color:#334155; font-weight:800; padding:8px 8px; background:#f3f4ff; border-bottom:1px solid rgba(17,24,39,0.06); }
        .tbl td { padding:8px 8px; border-bottom:1px solid rgba(17,24,39,0.05); font-size:13px; color:#0f172a; vertical-align:top; }
        .tbl tr:last-child td { border-bottom:none; }
        .role { color:#2563eb; font-weight:700; }
        .rejected-role { color:#e11d48; font-weight:700; }
        .muted { color:#64748b; font-size:13px; }
        .muted-count { color:#64748b; font-weight:900; }
        .stage { font-weight:900; }
        .notes { margin-top:6px; color:#64748b; font-size:12px; }

        .section-title { font-weight:900; color:#0f172a; margin:0 0 8px; font-size:14px; }

        .tip { color:#64748b; font-size:12px; line-height:1.5; }

        @media (min-width: 680px) {
          .two { display:grid; gap:12px; grid-template-columns:1fr 1fr; }
        }
      </style>
    </body>
  </html>`;

  return { html, text };
}

