"use client";

import React, { useMemo } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface SankeyPipelineProps {
  funnel: { stage: string; count: number }[];
}

function buildSankeyData(funnel: { stage: string; count: number }[]) {
  const applied = funnel[0]?.count ?? 0;
  const screened = funnel[1]?.count ?? 0;
  const interviewed = funnel[2]?.count ?? 0;
  const offers = funnel[3]?.count ?? 0;

  const nodes: { name: string }[] = [
    { name: "Applied" },
    { name: "Screening" },
    { name: "Interview" },
    { name: "Offer" },
    { name: "Lost (no screening)" },
    { name: "Lost (no interview)" },
    { name: "Lost (no offer)" },
  ];

  const links: { source: number; target: number; value: number }[] = [];

  if (screened > 0) links.push({ source: 0, target: 1, value: screened });
  if (applied - screened > 0) links.push({ source: 0, target: 4, value: applied - screened });
  if (interviewed > 0) links.push({ source: 1, target: 2, value: interviewed });
  if (screened - interviewed > 0) links.push({ source: 1, target: 5, value: screened - interviewed });
  if (offers > 0) links.push({ source: 2, target: 3, value: offers });
  if (interviewed - offers > 0) links.push({ source: 2, target: 6, value: interviewed - offers });

  return { nodes, links };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { source?: { name: string }; target?: { name: string }; value?: number }; name?: string; value?: number }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const source = p.source?.name ?? "?";
  const target = p.target?.name ?? "?";
  const value = p.value ?? payload[0]?.value ?? 0;
  return (
    <div className="border border-edge bg-surface px-3 py-2 text-[12px] font-light text-t-primary">
      {source} → {target}: <span className="font-medium text-accent">{value}</span> candidates
    </div>
  );
}

export default function SankeyPipeline({ funnel }: SankeyPipelineProps) {
  const { nodes, links } = useMemo(() => buildSankeyData(funnel), [funnel]);

  const hasData = links.length > 0;

  if (!hasData) {
    return (
      <div className="border border-edge bg-surface p-4 sm:p-5">
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-4">
          Pipeline Flow
        </h3>
        <p className="py-12 text-center text-[12px] font-light text-t-faint sm:text-[13px]">
          No pipeline data yet. Apply to jobs to see where you&apos;re losing candidates.
        </p>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-edge)",
    borderRadius: "6px",
    fontSize: 11,
    color: "var(--color-t-primary)",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border border-edge bg-surface p-4 sm:p-5"
    >
      <h3 className="mb-1 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-2">
        Pipeline Flow
      </h3>
      <p className="mb-3 text-[11px] font-light text-t-faint sm:mb-4">
        Where candidates move — Applied → Screening → Interview → Offer. Width = volume.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <Sankey
          data={{ nodes, links }}
          margin={{ top: 10, right: 20, bottom: 10, left: 20 }}
          node={{
            fill: "#a78bfa",
            stroke: "var(--color-edge)",
            strokeWidth: 1,
          }}
          link={{
            fill: "var(--color-accent)",
            fillOpacity: 0.65,
            stroke: "none",
          }}
          nodePadding={12}
          nodeWidth={14}
          linkCurvature={0.5}
          iterations={64}
        >
          <Tooltip content={<CustomTooltip />} contentStyle={tooltipStyle} />
        </Sankey>
      </ResponsiveContainer>
    </motion.div>
  );
}
