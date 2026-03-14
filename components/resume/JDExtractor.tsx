"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Check, AlertTriangle } from "lucide-react";

export interface ExtractedJD {
  jobTitle: string;
  company: string;
  location: string;
  jobType: string;
  type: "REMOTE" | "HYBRID" | "ONSITE";
  salary: string;
  notes: string;
  techStack: string[];
  extractionConfidence: "high" | "medium" | "low";
}

interface JDExtractorProps {
  /** Current job URL value */
  jobUrl: string;
  /** Called when user changes URL (optional for controlled input) */
  onJobUrlChange?: (url: string) => void;
  /** Called after successful extraction with fields to apply */
  onExtracted: (data: ExtractedJD) => void;
  /** Whether the extract button is disabled (e.g. no URL) */
  disabled?: boolean;
  /** Optional: show inline notes textarea on failure (for detail page) */
  showNotesFallback?: boolean;
  /** Current notes value when showNotesFallback (for PATCH) */
  notesValue?: string;
  onNotesChange?: (notes: string) => void;
  /** When showNotesFallback and on application detail, call this to PATCH app */
  onSaveExtracted?: (data: ExtractedJD) => Promise<void>;
  /** When showNotesFallback, optional "Save pasted JD" button */
  onSavePastedNotes?: (notes: string) => Promise<void>;
}

export default function JDExtractor({
  jobUrl,
  onJobUrlChange,
  onExtracted,
  disabled,
  showNotesFallback,
  notesValue = "",
  onNotesChange,
  onSaveExtracted,
  onSavePastedNotes,
}: JDExtractorProps) {
  const [extracting, setExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [highlight, setHighlight] = useState(false);

  const handleExtract = async () => {
    const url = jobUrl?.trim();
    if (!url) return;

    setExtracting(true);
    setExtractError(null);
    setExtractSuccess(false);
    setConfidence(null);

    try {
      const res = await fetch("/api/extract-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!data.success) {
        setExtractError(data.reason ?? "Could not extract JD.");
        return;
      }

      setExtractSuccess(true);
      setConfidence(data.extractionConfidence ?? "medium");
      setExtractError(null);

      const payload: ExtractedJD = {
        jobTitle: data.jobTitle ?? "",
        company: data.company ?? "",
        location: data.location ?? "",
        jobType: data.jobType ?? "",
        type: data.type ?? "REMOTE",
        salary: data.salary ?? "",
        notes: data.notes ?? "",
        techStack: Array.isArray(data.techStack) ? data.techStack : [],
        extractionConfidence: data.extractionConfidence ?? "medium",
      };

      if (onSaveExtracted) {
        await onSaveExtracted(payload);
      } else {
        onExtracted(payload);
      }

      setHighlight(true);
      setTimeout(() => setHighlight(false), 1500);
    } catch {
      setExtractError("Request failed. Please paste the JD manually.");
    } finally {
      setExtracting(false);
    }
  };

  const confidenceClass = {
    high: "text-[#4ade80]",
    medium: "text-[#fb923c]",
    low: "text-[#f87171]",
  };

  return (
    <div className="space-y-2">
      <div className={`flex gap-2 transition-colors duration-300 ${highlight ? "bg-[#e8ff4710]" : ""}`}>
        <input
          type="url"
          value={jobUrl}
          onChange={(e) => {
            onJobUrlChange?.(e.target.value);
            setExtractError(null);
            setExtractSuccess(false);
          }}
          placeholder="https://..."
          className="flex-1 border bg-bg px-3 py-2 text-[13px] text-t-primary placeholder:text-t-faint focus:outline-none border-edge focus:border-accent"
        />
        <button
          type="button"
          onClick={handleExtract}
          disabled={disabled || !jobUrl?.trim() || extracting}
          className="inline-flex items-center gap-1.5 border border-edge bg-bg px-3 py-2 text-[12px] font-medium text-t-primary transition-theme hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {extracting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="animate-pulse">Extracting...</span>
            </>
          ) : (
            <>
              Extract JD <ExternalLink className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      {extractSuccess && (
        <div className="flex items-center gap-2 text-[12px]">
          <Check className="h-4 w-4 text-[#4ade80]" />
          <span className="text-t-muted">JD extracted</span>
          {confidence && (
            <span className={confidenceClass[confidence]}>
              {confidence === "high" && "High confidence"}
              {confidence === "medium" && "Review suggested"}
              {confidence === "low" && "Please verify"}
            </span>
          )}
        </div>
      )}

      {extractError && (
        <div className="rounded border border-[#2a2000] bg-[#1a1200] p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#fb923c]" />
            <div>
              <p className="text-[12px] font-medium text-[#fb923c]">
                Couldn&apos;t extract JD automatically
              </p>
              <p className="mt-1 text-[12px] font-light text-t-muted">
                {extractError}
              </p>
              {showNotesFallback && (
                <>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-widest text-t-muted">
                    Please paste the job description manually:
                  </p>
                  <textarea
                    value={notesValue}
                    onChange={(e) => onNotesChange?.(e.target.value)}
                    placeholder="Paste the full job description here..."
                    rows={8}
                    className="mt-2 min-h-[200px] w-full resize-y border border-edge bg-bg px-3 py-2 text-[13px] font-light text-t-primary placeholder:text-t-muted focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="mt-1 text-[11px] text-[#333]">
                    Tip: Copy everything from Requirements to the end
                  </p>
                  {onSavePastedNotes && (
                    <button
                      type="button"
                      onClick={() => onSavePastedNotes(notesValue)}
                      className="mt-3 border border-accent bg-transparent px-3 py-1.5 text-[12px] font-medium text-accent hover:bg-accent/10"
                    >
                      Save pasted JD to application
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
