"use client";

import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { STATUS_LABELS, type AppStatus } from "@/types";
import ActivityHeatmap from "./ActivityHeatmap";

const STATUS_PIE_COLORS: Record<string, string> = {
  WISHLIST: "#555555",
  APPLIED: "#a78bfa",
  SCREENING: "#fbbf24",
  INTERVIEW: "#fb923c",
  OFFER: "#e8ff47",
  REJECTED: "#f87171",
  GHOSTED: "#444444",
};

interface StatsChartsProps {
  byStatus: Record<string, number>;
  weeklyData: { week: string; count: number }[];
  topStacks: [string, number][];
  responseRate: number;
  interviewConversion: number;
  avgDaysToResponse: number;
  stackResponseRates: { tag: string; total: number; responses: number; rate: number }[];
  funnel: { stage: string; count: number }[];
  bestDayData: { day: string; applied: number; responses: number; rate: number }[];
  resumeBreakdown: { label: string; total: number; responses: number; rate: number }[];
  dailyActivity: Record<string, number>;
}

export default function StatsCharts({
  byStatus,
  weeklyData,
  topStacks,
  responseRate,
  interviewConversion,
  avgDaysToResponse,
  stackResponseRates,
  funnel,
  bestDayData,
  resumeBreakdown,
  dailyActivity,
}: StatsChartsProps) {
  const pieData = Object.entries(byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status as AppStatus] ?? status,
    value: count,
    color: STATUS_PIE_COLORS[status] ?? "#555555",
  }));

  const stackData = topStacks.map(([name, count]) => ({ name, count }));

  const tooltipStyle = {
    backgroundColor: "#111111",
    border: "1px solid #1e1e1e",
    borderRadius: "6px",
    fontSize: 11,
    color: "#f0f0f0",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Rate cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
        <RateCard label="Response Rate" subtitle="Applied → Screening" value={`${responseRate}%`} />
        <RateCard label="Interview Conversion" subtitle="Applied → Interview" value={`${interviewConversion}%`} />
        <RateCard label="Avg Days to Response" subtitle="Applied → first update" value={`${avgDaysToResponse}d`} />
      </div>

      {/* Applications over time — area chart */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="border border-edge bg-surface p-4 sm:p-5">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
            Applications per Week
          </h3>
          {weeklyData.length === 0 ? (
            <p className="py-8 text-center text-[12px] font-light text-t-faint sm:text-[13px]">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8ff47" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e8ff47" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "#555" }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="#1a1a1a"
                />
                <YAxis tick={{ fontSize: 10, fill: "#555" }} allowDecimals={false} stroke="#1a1a1a" width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#e8ff47"
                  strokeWidth={2}
                  fill="url(#areaFill)"
                  dot={{ r: 3, fill: "#e8ff47", stroke: "#0a0a0a", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-edge bg-surface p-4 sm:p-5">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
            Status Breakdown
          </h3>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-[12px] font-light text-t-faint sm:text-[13px]">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  stroke="#0a0a0a"
                  fontSize={10}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status funnel */}
      {funnel.some((f) => f.count > 0) && (
        <div className="border border-edge bg-surface p-4 sm:p-5">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
            Status Funnel
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} allowDecimals={false} stroke="#1a1a1a" />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10, fill: "#555" }} width={70} stroke="#1a1a1a" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#e8ff47" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Response rate by stack + best day of week */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {stackResponseRates.length > 0 && (
          <div className="border border-edge bg-surface p-4 sm:p-5">
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
              Response Rate by Stack
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stackResponseRates} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} domain={[0, 100]} unit="%" stroke="#1a1a1a" />
                <YAxis type="category" dataKey="tag" tick={{ fontSize: 10, fill: "#555" }} width={70} stroke="#1a1a1a" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                <Bar dataKey="rate" fill="#a78bfa" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {bestDayData.some((d) => d.applied > 0) && (
          <div className="border border-edge bg-surface p-4 sm:p-5">
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
              Best Day to Apply
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bestDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#555" }} stroke="#1a1a1a" />
                <YAxis tick={{ fontSize: 10, fill: "#555" }} allowDecimals={false} stroke="#1a1a1a" width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="applied" fill="#e8ff47" name="Applied" radius={[2, 2, 0, 0]} />
                <Bar dataKey="responses" fill="#a78bfa" name="Responses" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Resume breakdown */}
      {resumeBreakdown.length > 0 && resumeBreakdown.some((r) => r.label !== "None") && (
        <div className="border border-edge bg-surface p-4 sm:p-5">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
            Resume Version Performance
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(120, resumeBreakdown.length * 36)}>
            <BarChart data={resumeBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} allowDecimals={false} stroke="#1a1a1a" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#555" }} width={80} stroke="#1a1a1a" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill="#555555" name="Total" radius={[0, 2, 2, 0]} />
              <Bar dataKey="responses" fill="#e8ff47" name="Responses" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top technologies */}
      {stackData.length > 0 && (
        <div className="border border-edge bg-surface p-4 sm:p-5">
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
            Top Technologies
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stackData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555" }} allowDecimals={false} stroke="#1a1a1a" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#555" }} width={70} stroke="#1a1a1a" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#e8ff47" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity heatmap */}
      <ActivityHeatmap data={dailyActivity} />
    </div>
  );
}

function RateCard({
  label,
  subtitle,
  value,
}: {
  label: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-edge bg-surface p-4 transition-theme hover:-translate-y-px hover:border-edge-hover sm:block sm:p-5">
      <p className="text-[28px] font-medium leading-none text-accent sm:text-[36px]">{value}</p>
      <div>
        <p className="text-[12px] font-medium text-t-primary sm:mt-1 sm:text-[13px]">{label}</p>
        <p className="text-[10px] font-light text-t-faint sm:text-[11px]">{subtitle}</p>
      </div>
    </div>
  );
}
