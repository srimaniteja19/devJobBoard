"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { JobSearchByNumbersData } from "@/lib/applications";
import styles from "./JobSearchByNumbers.module.css";

type ResumeRow = { label: string; total: number; responses: number; rate: number };

const TABS = ["Overview", "Referrals", "Resume"] as const;
type Tab = (typeof TABS)[number];

const DEFAULT_TZ = "America/New_York";

type StatDef = {
  heading: string;
  mid: string;
  valueGradient: string;
  glow: string;
  getValue: (d: JobSearchByNumbersData) => string | number;
  getSub: (d: JobSearchByNumbersData) => string;
};

const STAT_DEFS: StatDef[] = [
  {
    heading: "Applications",
    mid: "Sent out",
    valueGradient: "linear-gradient(105deg, #f0abfc 0%, #a855f7 55%, #7c3aed 100%)",
    glow: "rgba(168, 85, 247, 0.55)",
    getValue: (d) => d.totalApplications,
    getSub: (d) => d.applicationsNote,
  },
  {
    heading: "Interviews",
    mid: "Cycles active",
    valueGradient: "linear-gradient(105deg, #38bdf8 0%, #6366f1 100%)",
    glow: "rgba(56, 189, 248, 0.45)",
    getValue: (d) => d.interviewCycles,
    getSub: (d) => d.interviewCyclesNote,
  },
  {
    heading: "Ghost rate",
    mid: "Silent rejections",
    valueGradient: "linear-gradient(105deg, #5eead4 0%, #14b8a6 100%)",
    glow: "rgba(20, 184, 166, 0.45)",
    getValue: (d) => (d.totalApplications > 0 ? `${d.silentRejectionsPct}%` : "—"),
    getSub: (d) =>
      d.totalApplications === 0
        ? d.silentRejectionsNote
        : d.silentRejectionsPct === 0
          ? "No ghosted rows yet"
          : d.silentRejectionsNote,
  },
  {
    heading: "Pipeline",
    mid: "In progress",
    valueGradient: "linear-gradient(105deg, #fb7185 0%, #ec4899 50%, #db2777 100%)",
    glow: "rgba(236, 72, 153, 0.5)",
    getValue: (d) => d.outcomes.find((o) => o.key === "in_progress")?.count ?? 0,
    getSub: () => "Still active on the board",
  },
  {
    heading: "Offers",
    mid: "Received",
    valueGradient: "linear-gradient(105deg, #fef08a 0%, #eab308 45%, #ca8a04 100%)",
    glow: "rgba(234, 179, 8, 0.45)",
    getValue: (d) => d.offersReceived,
    getSub: (d) => d.offersReceivedNote,
  },
  {
    heading: "Closed",
    mid: "Declined / moved off",
    valueGradient: "linear-gradient(105deg, #fda4af 0%, #e11d48 100%)",
    glow: "rgba(225, 29, 72, 0.45)",
    getValue: (d) => d.offersDeclined,
    getSub: (d) => d.offersDeclinedNote,
  },
];

const OUTCOME_VISUAL: Record<string, { dot: string; fill: string }> = {
  no_response: { dot: "#a855f7", fill: "linear-gradient(90deg, #6d28d9, #c084fc)" },
  rejected: { dot: "#fb7185", fill: "linear-gradient(90deg, #be123c, #fda4af)" },
  interview_rejected: { dot: "#e879f9", fill: "linear-gradient(90deg, #a21caf, #f0abfc)" },
  in_progress: { dot: "#38bdf8", fill: "linear-gradient(90deg, #7c3aed, #38bdf8)" },
  offered: { dot: "#2dd4bf", fill: "linear-gradient(90deg, #0f766e, #5eead4)" },
};

const NEGATIVE_KEYS = new Set(["no_response", "rejected", "interview_rejected"]);
const POSITIVE_KEYS = new Set(["in_progress", "offered"]);

function liveBannerText(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long", timeZone: DEFAULT_TZ });
  const year = now.toLocaleString("en-US", { year: "numeric", timeZone: DEFAULT_TZ });
  return `· ${month.toUpperCase()} ${year}`;
}

export default function JobSearchByNumbers({
  data,
  resumeBreakdown,
}: {
  data: JobSearchByNumbersData;
  resumeBreakdown: ResumeRow[];
}) {
  const [tab, setTab] = useState<Tab>("Overview");

  const chartData = useMemo(
    () => data.monthlyVelocity.map((m) => ({ label: m.label, count: m.count, key: m.key })),
    [data.monthlyVelocity]
  );

  const { peakIndex, peakLabel, avgMonth, peakVal, trend } = useMemo(() => {
    const peakIdx = chartData.reduce(
      (best, row, i, arr) => (row.count > arr[best].count ? i : best),
      0
    );
    const total = chartData.reduce((s, d) => s + d.count, 0);
    const avg = total / 12;
    const peak = chartData[peakIdx]?.count ?? 0;
    const lbl = chartData[peakIdx]?.label ?? "—";
    const n = chartData.length;
    const last3 = chartData.slice(Math.max(0, n - 3)).reduce((s, d) => s + d.count, 0);
    const prev3 = chartData.slice(Math.max(0, n - 6), Math.max(0, n - 3)).reduce((s, d) => s + d.count, 0);
    let tr: "up" | "down" | "flat" = "flat";
    if (last3 > prev3) tr = "up";
    else if (last3 < prev3) tr = "down";
    return {
      peakIndex: peakIdx,
      peakLabel: lbl.toUpperCase(),
      avgMonth: avg.toFixed(1),
      peakVal: peak,
      trend: tr,
    };
  }, [chartData]);

  const outcomesTotal = data.outcomes.reduce((s, o) => s + o.count, 0);
  const maxOutcome = Math.max(...data.outcomes.map((o) => o.count), 1);

  const negativeOutcomes = data.outcomes.filter((o) => NEGATIVE_KEYS.has(o.key));
  const positiveOutcomes = data.outcomes.filter((o) => POSITIVE_KEYS.has(o.key));

  const insightCta = useMemo(() => {
    const total = data.totalApplications;
    if (total === 0) return "Add applications to your board to unlock these insights.";
    const inProgress = data.outcomes.find((o) => o.key === "in_progress")?.count ?? 0;
    if (inProgress / total >= 0.5) {
      return "Update statuses as you hear back to keep this accurate.";
    }
    if (data.silentRejectionsPct >= 25) {
      return "Move stale rows to Ghosted so your funnel reflects reality.";
    }
    return "Keep logging moves on the board—this view updates live.";
  }, [data]);

  const tooltipBg = "rgba(12, 12, 16, 0.92)";
  const tooltipStyle = {
    backgroundColor: tooltipBg,
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    fontSize: 11,
    color: "rgba(255,255,255,0.88)",
  };

  const hasChart = chartData.some((d) => d.count > 0);

  return (
    <section className={styles.shell}>
      <div className={styles.mesh} aria-hidden>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
        <div className={`${styles.blob} ${styles.blob4}`} />
      </div>
      <div className={styles.grain} aria-hidden />

      <div className={styles.inner}>
        <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2.5">
              <span className={styles.liveTag}>
                <span className={styles.liveDot} aria-hidden />
                <span>Live {liveBannerText()}</span>
              </span>
            </div>
            <h2 className={styles.title}>
              Job search by the{" "}
              <span className={styles.titleGrad}>numbers</span>
            </h2>
            <p className={styles.subtitle}>
              Personal analytics — applications, outcomes &amp; velocity.
            </p>
          </div>
          <div className={styles.daysPill}>
            <div className={styles.daysPillValue}>{data.daysSearching ?? "—"}</div>
            <div className={styles.daysPillLabel}>Days in the hunt</div>
          </div>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3">
          {STAT_DEFS.map((def) => (
            <div key={def.heading} className={styles.glassStat}>
              <span
                className={styles.statGlow}
                style={{ background: def.glow }}
                aria-hidden
              />
              <div className={styles.statHeading}>{def.heading}</div>
              <div className={styles.statValue} style={{ backgroundImage: def.valueGradient }}>
                {def.getValue(data)}
              </div>
              <div className={styles.statMid}>{def.mid}</div>
              <div className={styles.statSub}>{def.getSub(data)}</div>
            </div>
          ))}
        </div>

        <div className={styles.tabRow}>
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2 lg:gap-4">
            <div className={styles.panel}>
              <div className={styles.panelTitle}>Outcomes</div>
              <p className={styles.panelDesc}>
                {outcomesTotal > 0
                  ? `${outcomesTotal} application${outcomesTotal === 1 ? "" : "s"} on your board`
                  : "Move roles off wishlist to populate this view."}
              </p>

              {negativeOutcomes.map((row) => {
                const vis = OUTCOME_VISUAL[row.key] ?? OUTCOME_VISUAL.no_response;
                const widthPct = maxOutcome > 0 ? (row.count / maxOutcome) * 100 : 0;
                return (
                  <div key={row.key} className={styles.outcomeRow}>
                    <div className={styles.outcomeLabelRow}>
                      <div className={styles.outcomeLeft}>
                        <span
                          className={styles.outcomeDot}
                          style={{ background: vis.dot, boxShadow: `0 0 8px ${vis.dot}55` }}
                        />
                        <span className={styles.outcomeLabel}>
                          {row.label} <span className="opacity-70">{row.emoji}</span>
                        </span>
                      </div>
                      <span className={styles.outcomeMeta}>
                        {row.pct}% · {row.count}
                      </span>
                    </div>
                    <div className={styles.track}>
                      <div
                        className={styles.trackFill}
                        style={{
                          width: `${widthPct}%`,
                          backgroundImage: vis.fill,
                          minWidth: row.count > 0 ? 2 : 0,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className={styles.outcomeDivider}>
                <span>Forward motion</span>
              </div>

              {positiveOutcomes.map((row) => {
                const vis = OUTCOME_VISUAL[row.key] ?? OUTCOME_VISUAL.in_progress;
                const widthPct = maxOutcome > 0 ? (row.count / maxOutcome) * 100 : 0;
                return (
                  <div key={row.key} className={styles.outcomeRow}>
                    <div className={styles.outcomeLabelRow}>
                      <div className={styles.outcomeLeft}>
                        <span
                          className={styles.outcomeDot}
                          style={{ background: vis.dot, boxShadow: `0 0 8px ${vis.dot}55` }}
                        />
                        <span className={styles.outcomeLabel}>
                          {row.label} <span className="opacity-70">{row.emoji}</span>
                        </span>
                      </div>
                      <span className={styles.outcomeMeta}>
                        {row.pct}% · {row.count}
                      </span>
                    </div>
                    <div className={styles.track}>
                      <div
                        className={styles.trackFill}
                        style={{
                          width: `${widthPct}%`,
                          backgroundImage: vis.fill,
                          minWidth: row.count > 0 ? 2 : 0,
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <Link href="/applications" className={styles.ctaPill}>
                <span aria-hidden>✦</span>
                {insightCta}
              </Link>
            </div>

            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>Velocity</div>
                {hasChart && (
                  <span className={styles.peakBadge}>Peak: {peakLabel}</span>
                )}
              </div>
              <p className={styles.panelDesc}>{data.velocitySubtitle}</p>

              {!hasChart ? (
                <p className="py-8 text-center text-[11px] text-white/35">No monthly data yet</p>
              ) : (
                <>
                  <div className="h-[200px] w-full min-w-0 sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 4 }}>
                        <defs>
                          <linearGradient id="barPeakGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#38bdf8" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={28}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={36}>
                          {chartData.map((_, i) => (
                            <Cell
                              key={chartData[i].key}
                              fill={
                                i === peakIndex
                                  ? "url(#barPeakGrad)"
                                  : "rgba(255,255,255,0.08)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={styles.velocityFooter}>
                    <span className={styles.velocityStat}>
                      <strong>{avgMonth}</strong> avg/mo
                    </span>
                    <span className={styles.velocityStat}>
                      <strong>{peakVal}</strong> peak month
                    </span>
                    {trend === "up" && (
                      <span className={styles.trendUp}>
                        Trending up <span aria-hidden>↗</span>
                      </span>
                    )}
                    {trend === "down" && (
                      <span className={styles.trendDown}>Cooling down ↘</span>
                    )}
                    {trend === "flat" && (
                      <span className={styles.trendFlat}>Steady pace</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "Referrals" && (
          <div className={`${styles.panel} mt-4`}>
            <div className={styles.panelTitle}>Referrals &amp; people</div>
            <p className={styles.panelDesc}>
              Applications with saved contacts (intros, reach-outs, notes).
            </p>
            {data.referrals.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-white/35">
                Add contacts on an application to list them here.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {data.referrals.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-[12px] first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white/85">{r.company}</p>
                      <p className="truncate text-[11px] text-white/45">{r.role}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55">
                      {r.contactCount} contact{r.contactCount === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "Resume" && (
          <div className={`${styles.panel} mt-4`}>
            <div className={styles.panelTitle}>Resume versions</div>
            <p className={styles.panelDesc}>
              Volume and screening+ rate by resume label on your board.
            </p>
            {resumeBreakdown.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-white/35">
                Tag applications with a resume label to compare.
              </p>
            ) : (
              <div className="space-y-2.5">
                {resumeBreakdown.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-0.5 border-b border-white/[0.06] pb-2.5 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-[12px] text-white/80">{row.label}</span>
                    <div className="flex flex-wrap gap-x-3 text-[11px] tabular-nums text-white/45">
                      <span>
                        {row.total} app{row.total === 1 ? "" : "s"}
                      </span>
                      <span>
                        {row.responses} response{row.responses === 1 ? "" : "s"}
                      </span>
                      <span className="text-cyan-300/90">{row.rate}% rate</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
