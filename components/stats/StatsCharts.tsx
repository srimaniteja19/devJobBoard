"use client";

import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { STATUS_LABELS, type AppStatus } from "@/types";

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
}

export default function StatsCharts({
  byStatus,
  weeklyData,
  topStacks,
  responseRate,
  interviewConversion,
  avgDaysToResponse,
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
    fontSize: 12,
    color: "#f0f0f0",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RateCard label="Response Rate" subtitle="Applied → Screening" value={`${responseRate}%`} />
        <RateCard label="Interview Conversion" subtitle="Applied → Interview" value={`${interviewConversion}%`} />
        <RateCard label="Avg Days to Response" subtitle="Applied → first update" value={`${avgDaysToResponse}d`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-edge bg-surface p-5">
          <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-t-muted">
            Applications per Week
          </h3>
          {weeklyData.length === 0 ? (
            <p className="py-8 text-center text-[13px] font-light text-t-faint">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#555" }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  stroke="#1e1e1e"
                />
                <YAxis tick={{ fontSize: 11, fill: "#555" }} allowDecimals={false} stroke="#1e1e1e" />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#e8ff47"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#e8ff47", stroke: "#0a0a0a", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border border-edge bg-surface p-5">
          <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-t-muted">
            Status Breakdown
          </h3>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-[13px] font-light text-t-faint">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                  stroke="#0a0a0a"
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

      {stackData.length > 0 && (
        <div className="border border-edge bg-surface p-5">
          <h3 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-t-muted">
            Top Technologies Applied With
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stackData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#555" }} allowDecimals={false} stroke="#1e1e1e" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#555" }} width={80} stroke="#1e1e1e" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#e8ff47" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
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
    <div className="border border-edge bg-surface p-5 transition-theme hover:-translate-y-px hover:border-edge-hover">
      <p className="text-[36px] font-medium text-accent">{value}</p>
      <p className="mt-1 text-[13px] font-medium text-t-primary">{label}</p>
      <p className="text-[11px] font-light text-t-faint">{subtitle}</p>
    </div>
  );
}
