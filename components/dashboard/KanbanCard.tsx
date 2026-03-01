"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNowStrict } from "date-fns";
import { GripVertical } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { AppStatus } from "@/types";

const STATUS_ACCENT: Record<AppStatus, string> = {
  WISHLIST: "#dee2ff",
  APPLIED: "#cbc0d3",
  SCREENING: "#efd3d7",
  INTERVIEW: "#8e9aaf",
  OFFER: "#7b8fd4",
  REJECTED: "#c9a0a5",
  GHOSTED: "#e8e2ed",
};

interface KanbanCardProps {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  appliedAt: string | null;
  createdAt: string;
  onClick: () => void;
  /** Stagger delay in seconds for entrance (columnIndex * 0.06 + cardIndex * 0.045) */
  entranceDelay?: number;
}

export default function KanbanCard({
  id,
  company,
  role,
  status,
  appliedAt,
  createdAt,
  onClick,
  entranceDelay = 0,
}: KanbanCardProps) {
  const reducedMotion = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const date = appliedAt || createdAt;
  const ago = formatDistanceToNowStrict(new Date(date), { addSuffix: false });
  const accentColor = STATUS_ACCENT[status];

  const baseTransition = reducedMotion
    ? { duration: 0.1 }
    : { duration: 0.18, ease: "easeOut" as const };
  const dragTransition = reducedMotion
    ? { duration: 0.1 }
    : { type: "spring" as const, stiffness: 400, damping: 28 };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.92 }}
      animate={{
        opacity: isDragging && !reducedMotion ? 0.95 : 1,
        y: 0,
        scale: isDragging ? (reducedMotion ? 1 : 1.04) : 1,
        rotate: isDragging ? (reducedMotion ? 0 : 1.5) : 0,
        boxShadow: isDragging
          ? reducedMotion
            ? "0 1px 3px rgba(142,154,175,0.10)"
            : "0 20px 48px rgba(203,192,211,0.45)"
          : "0 1px 3px rgba(142,154,175,0.10)",
        cursor: isDragging ? "grabbing" : "pointer",
      }}
      transition={{
        opacity: reducedMotion ? { duration: 0.1 } : { delay: entranceDelay, duration: 0.25, ease: "easeOut" },
        y: reducedMotion ? { duration: 0.1 } : { delay: entranceDelay, duration: 0.25, ease: "easeOut" },
        scale: isDragging ? { duration: 0.15 } : dragTransition,
        rotate: isDragging ? { duration: 0.15 } : dragTransition,
        boxShadow: baseTransition,
      }}
      whileHover={
        reducedMotion || isDragging
          ? undefined
          : {
              scale: 1.02,
              y: -3,
              boxShadow: "0 12px 32px rgba(203,192,211,0.35)",
              transition: { duration: 0.18, ease: "easeOut" },
            }
      }
      style={sortableStyle}
      className="group relative cursor-pointer rounded-xl border border-[#e8e2ed] bg-white p-4"
      onClick={onClick}
    >
      {/* Top accent line — height 2px → 3px on hover */}
      <motion.div
        className="absolute left-0 right-0 top-0 rounded-t-xl"
        style={{ backgroundColor: accentColor }}
        initial={false}
        animate={{ height: 2 }}
        whileHover={reducedMotion || isDragging ? undefined : { height: 3 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
      />
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab touch-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 [&_svg]:text-[#cbc0d3]"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[15px] italic text-[#2d2535]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {company}
          </p>
          <p
            className="truncate text-[13px] font-light text-[#8e9aaf]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {role}
          </p>
          <p
            className="mt-0.5 text-[11px] font-light text-[#cbc0d3]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {ago}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
