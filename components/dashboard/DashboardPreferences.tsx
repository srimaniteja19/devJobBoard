"use client";

import { useState, useEffect, useCallback } from "react";

const DASHBOARD_THEME_KEY = "dashboard-theme";
const DASHBOARD_NOTES_KEY = "dashboard-notes";
const DASHBOARD_METRICS_KEY = "dashboard-metrics";

export type DashboardTheme = "focus" | "bold" | "minimal";
export type MetricId = "streak" | "applied" | "active" | "interviews" | "offers" | "rejected";

const DEFAULT_METRICS: MetricId[] = ["streak", "applied", "active", "interviews", "offers", "rejected"];

export function useDashboardTheme() {
  const [theme, setThemeState] = useState<DashboardTheme>("focus");
  useEffect(() => {
    const stored = localStorage.getItem(DASHBOARD_THEME_KEY) as DashboardTheme | null;
    if (stored && ["focus", "bold", "minimal"].includes(stored)) setThemeState(stored);
  }, []);
  const setTheme = useCallback((t: DashboardTheme) => {
    setThemeState(t);
    localStorage.setItem(DASHBOARD_THEME_KEY, t);
    document.getElementById("dashboard-root")?.setAttribute("data-dashboard-theme", t);
  }, []);
  useEffect(() => {
    document.getElementById("dashboard-root")?.setAttribute("data-dashboard-theme", theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

export function useDashboardNotes() {
  const [notes, setNotesState] = useState("");
  useEffect(() => {
    setNotesState(localStorage.getItem(DASHBOARD_NOTES_KEY) ?? "");
  }, []);
  const setNotes = useCallback((v: string) => {
    setNotesState(v);
    localStorage.setItem(DASHBOARD_NOTES_KEY, v);
  }, []);
  return [notes, setNotes] as const;
}

export function useDashboardMetrics() {
  const [metrics, setMetricsState] = useState<MetricId[]>(DEFAULT_METRICS);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_METRICS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MetricId[];
        if (Array.isArray(parsed)) setMetricsState(parsed);
      }
    } catch {
      // ignore
    }
  }, []);
  const setMetrics = useCallback((m: MetricId[]) => {
    setMetricsState(m);
    localStorage.setItem(DASHBOARD_METRICS_KEY, JSON.stringify(m));
  }, []);
  return [metrics, setMetrics] as const;
}
