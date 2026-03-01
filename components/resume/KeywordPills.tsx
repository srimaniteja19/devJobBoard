"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface KeywordPresent {
  keyword: string;
  frequency: number;
  importance: string;
}

interface KeywordMissing {
  keyword: string;
  importance: string;
  whereToAdd: string;
  suggestedPhrase: string;
}

interface KeywordOverused {
  keyword: string;
  count: number;
  suggestion: string;
}

interface KeywordPillsProps {
  present?: KeywordPresent[];
  missing?: KeywordMissing[];
  overused?: KeywordOverused[];
  onCopy?: (text: string) => void;
}

export default function KeywordPills({
  present = [],
  missing = [],
  overused = [],
  onCopy,
}: KeywordPillsProps) {
  const [expandedMissing, setExpandedMissing] = useState<Record<number, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onCopy?.(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const importanceDot = (imp: string) => {
    if (imp === "critical") return "●";
    if (imp === "important") return "◉";
    return "○";
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {missing.length > 0 && (
        <div>
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#f87171]">
            Missing
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {missing.map((m, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedMissing((p) => ({ ...p, [i]: !p[i] }))
                  }
                  className="rounded border border-[#3a1a1a] bg-[#1a0a0a] px-2 py-1 text-[12px] font-light text-[#f87171] transition-colors hover:border-[#4a2a2a]"
                >
                  {m.keyword}
                </button>
                {expandedMissing[i] && (
                  <div className="mt-2 rounded border border-edge bg-bg p-2">
                    <p className="text-[11px] text-t-muted">
                      Where: {m.whereToAdd}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[12px] text-t-primary">
                        {m.suggestedPhrase}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(m.suggestedPhrase, `missing-${i}`)
                        }
                        className="shrink-0 border border-edge bg-surface px-2 py-0.5 text-[10px] text-accent hover:bg-accent/10"
                      >
                        {copiedKey === `missing-${i}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {present.length > 0 && (
        <div>
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#4ade80]">
            Present
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {present.map((p, i) => (
              <span
                key={i}
                className="rounded border border-[#1a3a1a] bg-[#0a1a0a] px-2 py-1 text-[12px] font-light text-[#4ade80]"
              >
                {importanceDot(p.importance)} {p.keyword}
                {p.frequency > 1 && (
                  <span className="ml-0.5 text-[10px] opacity-70">
                    ×{p.frequency}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {overused.length > 0 && (
        <div>
          <h4 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-[#fb923c]">
            Overused
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {overused.map((o, i) => (
              <span
                key={i}
                title={o.suggestion}
                className="rounded border border-[#2a2a1a] bg-[#1a1a0a] px-2 py-1 text-[12px] font-light text-[#fb923c]"
              >
                {o.keyword} ({o.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
