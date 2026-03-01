"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNowStrict } from "date-fns";
import { GripVertical } from "lucide-react";
import type { AppStatus } from "@/types";

interface KanbanCardProps {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  appliedAt: string | null;
  createdAt: string;
  onClick: () => void;
}

export default function KanbanCard({
  id,
  company,
  role,
  appliedAt,
  createdAt,
  onClick,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const date = appliedAt || createdAt;
  const ago = formatDistanceToNowStrict(new Date(date), { addSuffix: false });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer border border-edge bg-surface p-4 transition-theme hover:border-accent ${
        isDragging ? "opacity-40" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-[#2a2a2a] opacity-0 transition-theme group-hover:opacity-100 hover:text-t-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-t-primary">{company}</p>
          <p className="truncate text-[13px] font-light text-[#777]">{role}</p>
          <p className="mt-2 text-[11px] font-light text-t-faint">{ago}</p>
        </div>
      </div>
    </div>
  );
}
