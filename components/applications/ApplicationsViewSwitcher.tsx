"use client";

import { Table2, LayoutGrid } from "lucide-react";

type ViewMode = "table" | "cards";

interface Props {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export default function ApplicationsViewSwitcher({ mode, onModeChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[#1e1e1e] bg-[#111] p-0.5">
      <button
        type="button"
        onClick={() => onModeChange("table")}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12px] transition-theme ${
          mode === "table"
            ? "bg-accent text-bg"
            : "text-t-muted hover:text-t-primary"
        }`}
      >
        <Table2 className="h-3.5 w-3.5" />
        Table
      </button>
      <button
        type="button"
        onClick={() => onModeChange("cards")}
        className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[12px] transition-theme ${
          mode === "cards"
            ? "bg-accent text-bg"
            : "text-t-muted hover:text-t-primary"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Cards
      </button>
    </div>
  );
}
