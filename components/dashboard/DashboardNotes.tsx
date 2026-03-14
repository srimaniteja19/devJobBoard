"use client";

import { useRef, useEffect } from "react";
import { FileText } from "lucide-react";

interface DashboardNotesProps {
  value: string;
  onChange: (v: string) => void;
}

export default function DashboardNotes({ value, onChange }: DashboardNotesProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.style.height = "auto";
    if (ref.current) ref.current.style.height = `${Math.min(ref.current.scrollHeight, 120)}px`;
  }, [value]);

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
    >
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--dash-card-border)" }}>
        <FileText className="h-4 w-4" style={{ color: "var(--dash-column-text)" }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--dash-column-text)" }}>
          Daily goals & notes
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What do you want to accomplish today?"
        rows={2}
        className="w-full resize-none border-0 bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:opacity-60"
        style={{ color: "var(--dash-card-company)", minHeight: 60 }}
      />
    </div>
  );
}
