"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import type { DashboardTheme } from "./DashboardPreferences";

const THEMES: { id: DashboardTheme; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "bold", label: "Bold" },
  { id: "minimal", label: "Minimal" },
];

interface ThemeSelectorProps {
  value: DashboardTheme;
  onChange: (t: DashboardTheme) => void;
}

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors hover:bg-black/5"
        style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-column-text)" }}
      >
        <Palette className="h-3.5 w-3.5" />
        {THEMES.find((t) => t.id === value)?.label ?? "Theme"}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-xl border py-1 shadow-lg"
            style={{ backgroundColor: "var(--dash-card-bg)", borderColor: "var(--dash-card-border)" }}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-black/5 ${
                  value === t.id ? "font-semibold" : ""
                }`}
                style={{ color: value === t.id ? "var(--dash-card-company)" : "var(--dash-column-text)" }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
