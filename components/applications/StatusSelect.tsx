"use client";

import { useState } from "react";
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS, type AppStatus } from "@/types";
import { useToast } from "@/components/providers/ToastProvider";

interface StatusSelectProps {
  applicationId: string;
  currentStatus: AppStatus;
  company?: string;
  prepLinkOnStatusChange?: boolean;
}

export default function StatusSelect({ applicationId, currentStatus, company, prepLinkOnStatusChange }: StatusSelectProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = async (newStatus: string) => {
    const prev = status;
    setStatus(newStatus as AppStatus);
    setLoading(true);

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setStatus(prev);
      } else {
        if (prepLinkOnStatusChange) {
          toast("Stage updated → new prep available", {
            action: {
              label: "Open Prep →",
              onClick: () => document.getElementById("prep-section")?.scrollIntoView({ behavior: "smooth" }),
            },
          });
        } else {
          toast(`${company || "Application"} → ${STATUS_LABELS[newStatus as AppStatus]}`);
        }
      }
    } catch {
      setStatus(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`cursor-pointer border-none bg-transparent text-[13px] font-medium outline-none ${STATUS_COLORS[status]}`}
    >
      {KANBAN_COLUMNS.map((s) => (
        <option key={s} value={s} className="bg-surface text-t-primary">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
