"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { FileDown, Loader2 } from "lucide-react";
import { parseYMDLocal } from "@/lib/date-helpers";
import { generateWeeklyInterviewPacketPdf } from "@/lib/prep-to-pdf";
import type { WeekPacketEntry } from "@/lib/week-interview-packet";
import { useToast } from "@/components/providers/ToastProvider";

type WeekPacketResponse = {
  rangeStartYmd: string;
  rangeEndYmd: string;
  entries: WeekPacketEntry[];
};

export default function DownloadWeekPacketButton() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/week-packet-data");
      if (!res.ok) {
        toast("Could not load calendar data for the packet");
        return;
      }
      const data = (await res.json()) as WeekPacketResponse;
      const start = parseYMDLocal(data.rangeStartYmd);
      const end = parseYMDLocal(data.rangeEndYmd);
      const rangeLabel = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
      const doc = generateWeeklyInterviewPacketPdf(rangeLabel, data.entries);
      const fname = `interview-packet-${data.rangeStartYmd}-to-${data.rangeEndYmd}.pdf`;
      doc.save(fname);
      toast(
        data.entries.length === 0
          ? "PDF saved (no events this week — add interviews to fill it)"
          : `PDF saved · ${data.entries.length} event${data.entries.length === 1 ? "" : "s"}`
      );
    } catch {
      toast("Could not build interview packet PDF");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <button
      type="button"
      onClick={download}
      disabled={loading}
      className="inline-flex shrink-0 items-center gap-2 self-start border border-edge bg-surface px-3 py-2 text-[12px] font-medium text-t-muted transition-theme hover:border-accent/50 hover:text-t-primary disabled:opacity-60 sm:self-auto"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Week interview PDF
    </button>
  );
}
