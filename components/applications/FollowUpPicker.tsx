"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, X } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

interface Props {
  applicationId: string;
  currentDate: string | null;
}

export default function FollowUpPicker({ applicationId, currentDate }: Props) {
  const [date, setDate] = useState(currentDate ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const save = async (val: string) => {
    setDate(val);
    setSaving(true);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDate: val || null }),
      });
      toast(val ? "Follow-up reminder set" : "Reminder removed");
      router.refresh();
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarClock className="h-3 w-3 text-t-faint sm:h-3.5 sm:w-3.5" />
      <input
        type="date"
        value={date}
        onChange={(e) => save(e.target.value)}
        disabled={saving}
        className="border-none bg-transparent text-[12px] font-light text-t-muted focus:outline-none sm:text-[13px]"
      />
      {date && (
        <button
          onClick={() => save("")}
          className="text-t-faint transition-theme hover:text-[#f87171]"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
