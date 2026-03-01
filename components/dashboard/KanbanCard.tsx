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
      className={`group cursor-pointer border border-edge bg-surface p-3 transition-theme hover:border-accent sm:p-4 ${
        isDragging ? "opacity-40" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-1.5 sm:gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-[#2a2a2a] opacity-100 sm:opacity-0 sm:transition-theme sm:group-hover:opacity-100 hover:text-t-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-t-primary sm:text-[14px]">{company}</p>
          <p className="truncate text-[11px] font-light text-[#777] sm:text-[13px]">{role}</p>
          <p className="mt-1 text-[10px] font-light text-t-faint sm:mt-2 sm:text-[11px]">{ago}</p>
        </div>
      </div>
    </div>
  );
}
