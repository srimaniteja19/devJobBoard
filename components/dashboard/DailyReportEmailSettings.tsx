"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  initialEnabled: boolean;
  initialRecipientEmails: string[];
};

function joinEmailsForInput(emails: string[]): string {
  return emails.join("\n");
}

export default function DailyReportEmailSettings({
  initialEnabled,
  initialRecipientEmails,
}: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [emailsText, setEmailsText] = useState(joinEmailsForInput(initialRecipientEmails));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(initialEnabled);
    setEmailsText(joinEmailsForInput(initialRecipientEmails));
  }, [initialEnabled, initialRecipientEmails]);

  const parsedCount = useMemo(() => {
    return emailsText
      .split(/[,\n;\r\t ]+/g)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [emailsText]);

  async function onSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/dashboard/daily-report-email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          recipientEmails: emailsText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed: ${res.status}`);
      }
      setStatus("Saved.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
    >
      <div
        className="flex items-start gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--dash-card-border)" }}
      >
        <div className="flex-1">
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--dash-column-text)" }}
          >
            Daily Email Report
          </h3>
          <p className="mt-1 text-[11px]" style={{ color: "var(--dash-column-text)", opacity: 0.85 }}>
            Sends you a summary at <b style={{ color: "var(--dash-card-company)" }}>5:00 PM ET</b> daily.
            Enter recipient email(s) below—no address is hardcoded.
          </p>
        </div>

        <label className="mt-[1px] flex items-center gap-2 text-[11px] font-medium" style={{ color: "var(--dash-column-text)" }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>

      <div className="px-3 py-2.5">
        <textarea
          className="w-full resize-none border-0 bg-transparent px-0 py-1.5 text-[13px] outline-none placeholder:opacity-60"
          rows={4}
          placeholder={"example@domain.com\nanother@domain.com"}
          value={emailsText}
          onChange={(e) => setEmailsText(e.target.value)}
          disabled={!enabled}
          style={{ color: "var(--dash-card-company)" }}
        />

        <p className="mt-1 text-[11px]" style={{ color: "var(--dash-column-text)", opacity: 0.85 }}>
          {enabled ? `${parsedCount} email(s) detected` : "Disabled"}
        </p>

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-black/5 disabled:opacity-60"
            style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-card-company)" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {status ? (
          <div className="mt-2 text-[11px]" style={{ color: "var(--dash-column-text)", opacity: 0.85 }}>
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}

