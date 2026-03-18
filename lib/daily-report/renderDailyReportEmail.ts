import { escape } from "@/lib/html";

export type AppRef = {
  company: string;
  role: string;
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
  applied: AppRef[];
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
  const appliedList = data.applied
    .map((a) => `<li>${escape(a.company)} — <span style="color:#60a5fa">${escape(a.role)}</span></li>`)
    .join("");
  const rejectedList = data.rejected
    .map((a) => `<li>${escape(a.company)} — <span style="color:#fb7185">${escape(a.role)}</span></li>`)
    .join("");

  const movedSections = Object.entries(data.moved)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([stage, apps]) => {
      if (!apps.length) return "";
      const color =
        stage === "SCREENING"
          ? "#fbbf24"
          : stage === "INTERVIEW"
            ? "#fb923c"
            : stage === "OFFER"
              ? "#e8ff47"
              : "#a78bfa";
      const items = apps
        .map(
          (a) =>
            `<li>${escape(a.company)} — <span style="color:${color}">${escape(a.role)}</span></li>`
        )
        .join("");
      return `
        <div class="card">
          <div class="card-title">${escape(stage)}</div>
          <ul class="list">${items}</ul>
        </div>
      `;
    })
    .join("");

  const followUpsList = data.followUps.length
    ? `<ul class="list">${data.followUps
        .map((f) => {
          const prep = f.prepSectionLabels.length
            ? `<div class="muted"><b>Prep:</b> ${escape(f.prepSectionLabels.slice(0, 3).join(", "))}</div>`
            : `<div class="muted"><b>Prep:</b> Not generated yet</div>`;
          return `
            <li>
              <div><b>${escape(f.company)}</b> — <span style="color:#60a5fa">${escape(f.role)}</span></div>
              <div class="muted">${escape(f.status)} • Due: ${escape(f.dueAtISO)}</div>
              ${prep}
            </li>
          `;
        })
        .join("")}</ul>`
    : `<div class="muted">No follow-up reminders due in the next window.</div>`;

  const eventsList = data.scheduledEvents.length
    ? `<ul class="list">${data.scheduledEvents
        .map((e) => {
          const notes = e.notes ? `<div class="muted">${escape(e.notes)}</div>` : "";
          const prep = e.prepSectionLabels.length
            ? `<div class="muted"><b>Prep:</b> ${escape(e.prepSectionLabels.slice(0, 3).join(", "))}</div>`
            : `<div class="muted"><b>Prep:</b> Not generated yet</div>`;
          return `
            <li>
              <div><b>${escape(e.eventLabel)}</b>: ${escape(e.company)} — <span style="color:#60a5fa">${escape(e.role)}</span></div>
              <div class="muted">When: ${escape(e.scheduledAtISO)}</div>
              <div class="muted">${escape(e.status)}</div>
              ${prep}
              ${notes}
            </li>
          `;
        })
        .join("")}</ul>`
    : `<div class="muted">No scheduled events in the next window.</div>`;

  const coachBlock = data.coachTitle
    ? `
      <div class="card card-hero">
        <div class="card-title">${escape(data.coachTitle)}</div>
        ${
          data.coachParagraphs?.length
            ? `<div class="p">${data.coachParagraphs
                .map((p) => `<p>${escape(p)}</p>`)
                .join("")}</div>`
            : ""
        }
        ${
          data.coachBullets?.length
            ? `<ul class="bullets">${data.coachBullets
                .slice(0, 5)
                .map((b) => `<li>${escape(b)}</li>`)
                .join("")}</ul>`
            : ""
        }
      </div>
    `
    : "";

  const text = [
    `Daily Job Board Report — ${data.reportDateYMD}`,
    "",
    `Applied: ${data.applied.length}`,
    ...data.applied.map((a) => `- ${a.company} — ${a.role}`),
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
    <body style="margin:0;padding:0;background:#0b1220;color:#e5e7eb;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji';">
      <div style="max-width:720px;margin:0 auto;padding:24px;">
        <div style="padding:18px 20px;border-radius:14px;background:linear-gradient(135deg,#0f172a,#111827);border:1px solid rgba(255,255,255,0.08);">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:12px;height:12px;border-radius:999px;background:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,0.15);"></div>
            <div style="font-size:18px;font-weight:700;letter-spacing:-0.01em;">Daily Job Board Report</div>
          </div>
          <div style="margin-top:8px;color:#94a3b8;font-size:13px;">
            Date: <b style="color:#cbd5e1">${escape(data.reportDateYMD)}</b> • Generated: <span>${escape(
              new Date(data.generatedAtISO).toISOString()
            )}</span>
          </div>
        </div>

        <div style="height:16px;"></div>
        ${coachBlock}

        <div style="height:16px;"></div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Applied</div>
            <div class="big">${data.applied.length}</div>
            ${data.applied.length ? `<ul class="list">${appliedList}</ul>` : `<div class="muted">No new applications marked as applied.</div>`}
          </div>

          <div class="card">
            <div class="card-title">Rejected</div>
            <div class="big">${data.rejected.length}</div>
            ${data.rejected.length ? `<ul class="list">${rejectedList}</ul>` : `<div class="muted">No applications marked as rejected.</div>`}
          </div>
        </div>

        <div style="height:16px;"></div>
        <div class="section-title">Moved to Next Steps (${movedTotal})</div>
        ${movedSections || `<div class="muted">No stage transitions into Screening/Interview/Offer today.</div>`}

        <div style="height:16px;"></div>
        <div class="section-title">Follow-ups & Events (Next Window)</div>
        <div class="grid">
          <div class="card">
            <div class="card-title">Follow-up Reminders</div>
            ${followUpsList}
          </div>
          <div class="card">
            <div class="card-title">Scheduled Events</div>
            ${eventsList}
          </div>
        </div>

        <div style="height:18px;"></div>
        <div style="color:#64748b;font-size:12px;line-height:1.5;">
          Tip: If a follow-up shows “Prep: Not generated yet”, open the application and generate the prep once to get a better email draft tomorrow.
        </div>
      </div>

      <style>
        .grid { display:grid; gap:12px; grid-template-columns: 1fr; }
        .card { border:1px solid rgba(255,255,255,0.08); background:#0f172a; border-radius:14px; padding:14px; }
        .card-hero { background:linear-gradient(135deg, rgba(52,211,153,0.12), rgba(96,165,250,0.12)), #0f172a; border-color: rgba(52,211,153,0.25); }
        .card-title { font-weight:700; letter-spacing: -0.01em; color:#e5e7eb; margin-bottom:6px; }
        .big { font-size:34px; font-weight:800; margin:4px 0 10px; color:#e5e7eb; }
        .section-title { font-weight:800; color:#e5e7eb; margin:0 0 8px; }
        .list { padding-left:18px; margin:10px 0 0; }
        .list li { margin:6px 0; color:#e5e7eb; }
        .muted { color:#94a3b8; margin-top:8px; font-size:13px; }
        .p p { margin:8px 0; }
        .bullets { padding-left:18px; margin:10px 0 0; }
        .bullets li { margin:6px 0; }

        @media (min-width: 680px) {
          .grid { grid-template-columns: 1fr 1fr; }
        }
      </style>
    </body>
  </html>`;

  return { html, text };
}

