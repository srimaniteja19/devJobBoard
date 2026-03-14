"use client";

import { useState, useEffect } from "react";
import { X, Check, Send } from "lucide-react";

const STORAGE_KEY = (appId: string) => `resume-checklist-${appId}`;

interface ResumeMatchResult {
  criticalIssues?: Array<{ issue: string; fix: string }>;
  quickWins?: Array<{ action: string; timeToFix: string }>;
  keywordAnalysis?: {
    missing?: Array<{ keyword: string; suggestedPhrase: string }>;
  };
  sectionAnalysis?: {
    summary?: { rewrite?: string };
  };
}

interface ApplyChangesChecklistProps {
  result: ResumeMatchResult;
  applicationId: string;
  onClose: () => void;
  onStatusChange: () => void;
}

type ChecklistItem = {
  id: string;
  group: "critical" | "quickWin" | "keyword" | "section";
  label: string;
  detail?: string;
};

export default function ApplyChangesChecklist({
  result,
  applicationId,
  onClose,
  onStatusChange,
}: ApplyChangesChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [movingToApplied, setMovingToApplied] = useState(false);

  const items: ChecklistItem[] = [];
  let idx = 0;

  result.criticalIssues?.forEach((c) => {
    items.push({
      id: `critical-${idx}`,
      group: "critical",
      label: c.issue,
      detail: c.fix,
    });
    idx++;
  });
  idx = 0;
  result.quickWins?.forEach((q) => {
    items.push({
      id: `quick-${idx}`,
      group: "quickWin",
      label: q.action,
      detail: q.timeToFix,
    });
    idx++;
  });
  idx = 0;
  result.keywordAnalysis?.missing?.forEach((m) => {
    items.push({
      id: `keyword-${idx}`,
      group: "keyword",
      label: `Add: ${m.keyword}`,
      detail: m.suggestedPhrase,
    });
    idx++;
  });
  if (result.sectionAnalysis?.summary?.rewrite) {
    items.push({
      id: "section-summary",
      group: "section",
      label: "Update summary",
      detail: "Use tailored summary",
    });
  }

  const criticalItems = items.filter((i) => i.group === "critical");
  const criticalCount = criticalItems.length;
  const criticalChecked = criticalItems.filter((i) => checked.has(i.id)).length;
  const allCriticalChecked = criticalCount === 0 || criticalChecked === criticalCount;
  const totalChecked = items.filter((i) => checked.has(i.id)).length;
  const allChecked = totalChecked === items.length && items.length > 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(applicationId));
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setChecked(new Set(parsed));
      }
    } catch {}
  }, [applicationId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY(applicationId),
        JSON.stringify(Array.from(checked))
      );
    } catch {}
  }, [applicationId, checked]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMoveToApplied = async () => {
    setMovingToApplied(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPLIED" }),
      });
      if (res.ok) {
        onStatusChange();
        onClose();
      }
    } finally {
      setMovingToApplied(false);
    }
  };

  const groups = [
    { key: "critical", label: "Critical Fixes", items: items.filter((i) => i.group === "critical") },
    { key: "quickWin", label: "Quick Wins", items: items.filter((i) => i.group === "quickWin") },
    { key: "keyword", label: "Keyword Adds", items: items.filter((i) => i.group === "keyword") },
    { key: "section", label: "Section Rewrites", items: items.filter((i) => i.group === "section") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg border border-edge bg-surface">
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h3 className="text-[14px] font-medium text-t-primary">
            Apply Changes Checklist
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-t-muted hover:text-t-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ maxHeight: "60vh" }}>
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{
                  width: items.length > 0 ? `${(totalChecked / items.length) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-[11px] font-medium text-t-muted">
              {totalChecked} of {items.length} changes made
            </span>
          </div>

          {groups.map((group) => (
            <div key={group.key} className="mb-4">
              <h4 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted">
                {group.label}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded border border-edge bg-bg p-3 transition-colors hover:border-edge-hover"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="mt-1 h-4 w-4 rounded border-edge accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-[13px] font-light ${
                          checked.has(item.id)
                            ? "text-t-muted line-through"
                            : "text-t-primary"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.detail && (
                        <p className="mt-0.5 text-[11px] text-[#555]">
                          {item.detail}
                        </p>
                      )}
                    </div>
                    {checked.has(item.id) && (
                      <Check className="h-4 w-4 shrink-0 text-[#4ade80]" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-edge p-4">
          {allCriticalChecked && (
            <button
              type="button"
              onClick={handleMoveToApplied}
              disabled={movingToApplied}
              className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {movingToApplied ? (
                "Updating..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Ready to apply! Move to Applied →
                </>
              )}
            </button>
          )}
          {allChecked && !allCriticalChecked && (
            <p className="text-center text-[12px] font-medium text-[#4ade80]">
              ✓ All changes checked!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
