"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { STATUS_LABELS, STATUS_COLORS, KANBAN_COLUMNS, type AppStatus } from "@/types";
import { useToast } from "@/components/providers/ToastProvider";

interface Props {
  applicationId: string;
  company: string;
  currentStatus: string;
  children: React.ReactNode;
  onAddEvent?: () => void;
}

export default function KanbanContextMenu({
  applicationId,
  company,
  currentStatus,
  children,
  onAddEvent,
}: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleContext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    if (!pos) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPos(null);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setPos(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [pos]);

  const moveTo = async (status: AppStatus) => {
    setPos(null);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast(`${company} → ${STATUS_LABELS[status]}`);
    } catch {}
  };

  return (
    <div onContextMenu={handleContext}>
      {children}
      {pos && (
        <div
          ref={menuRef}
          className="fixed z-[60] border border-edge bg-surface py-1"
          style={{ left: pos.x, top: pos.y }}
        >
          {onAddEvent && (
            <button
              type="button"
              onClick={() => {
                setPos(null);
                onAddEvent();
              }}
              className="flex w-full px-3 py-2 text-left text-[12px] font-medium text-t-primary transition-theme hover:bg-bg"
            >
              Add event…
            </button>
          )}
          {onAddEvent && (
            <div className="mx-2 border-t border-edge" role="separator" />
          )}
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-widest text-t-faint">
            Move to
          </p>
          {KANBAN_COLUMNS.filter((s) => s !== currentStatus).map((s) => (
            <button
              key={s}
              onClick={() => moveTo(s)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] font-light transition-theme hover:bg-bg ${STATUS_COLORS[s]}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
