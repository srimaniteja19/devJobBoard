"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import KanbanCard from "./KanbanCard";
import KanbanContextMenu from "./KanbanContextMenu";
import { useToast } from "@/components/providers/ToastProvider";
import {
  KANBAN_COLUMNS,
  STATUS_LABELS,
  type AppStatus,
} from "@/types";

const STATUS_ACCENT: Record<AppStatus, string> = {
  WISHLIST: "#dee2ff",
  APPLIED: "#cbc0d3",
  SCREENING: "#efd3d7",
  INTERVIEW: "#8e9aaf",
  OFFER: "#7b8fd4",
  REJECTED: "#c9a0a5",
  GHOSTED: "#e8e2ed",
};

interface AppItem {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: string | null;
  createdAt: string;
  resumeMatchScore: number | null;
  resumeMatchCriticalCount: number;
}

function Column({
  status,
  items,
  onCardClick,
  isLast,
  columnIndex,
}: {
  status: AppStatus;
  items: AppItem[];
  onCardClick: (id: string) => void;
  isLast: boolean;
  columnIndex: number;
}) {
  const reducedMotion = useReducedMotion();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const columnDelay = reducedMotion ? 0 : columnIndex * 0.06;

  return (
    <motion.div
      ref={setNodeRef}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0.1 }
          : { delay: columnDelay, duration: 0.35, ease: "easeOut" }
      }
      className={`flex min-h-[120px] min-w-[132px] flex-1 flex-col sm:min-w-[140px] ${
        !isLast ? "border-r border-[rgba(203,192,211,0.2)]" : ""
      }`}
    >
      <div
        className="sticky top-0 z-10 flex shrink-0 items-center gap-2 px-2 py-2 sm:px-3 sm:py-2.5"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <span
          className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-[#8e9aaf]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {STATUS_LABELS[status]}
        </span>
        <motion.span
          key={items.length}
          initial={reducedMotion ? false : { scale: 1.3, color: "#cbc0d3" }}
          animate={{ scale: 1, color: "#8e9aaf" }}
          transition={
            reducedMotion
              ? { duration: 0.1 }
              : { duration: 0.3, ease: "easeOut" }
          }
          className="shrink-0 rounded-[20px] border border-[#e8e2ed] bg-white px-2 py-0.5 text-[11px] font-medium"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {items.length}
        </motion.span>
      </div>
      <motion.div
        layout
        className="scroll-thin-y min-h-0 max-h-[calc(100vh-320px)] flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden rounded-[10px] px-2 py-3 sm:max-h-[calc(100vh-360px)] sm:space-y-2"
        style={{
          background: "rgba(255,255,255,0.3)",
          padding: "12px 8px",
        }}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.length === 0 ? (
            <motion.div
              className="flex min-h-[120px] items-center justify-center rounded-[10px] border border-dashed border-[#e8e2ed] text-[11px] text-[#8e9aaf]"
              style={{
                background: "rgba(255,255,255,0.15)",
                fontFamily: "'DM Sans', sans-serif",
              }}
              animate={{
                opacity: isOver ? 0.8 : [0.4, 0.7, 0.4],
              }}
              transition={
                isOver
                  ? { duration: 0.15 }
                  : reducedMotion
                    ? { duration: 0.1 }
                    : {
                        duration: 3,
                        ease: "easeInOut",
                        repeat: Infinity,
                      }
              }
            >
              {isOver ? "Drop here" : "\u00a0"}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {items.map((item, cardIndex) => {
                const entranceDelay = reducedMotion
                  ? 0
                  : columnIndex * 0.06 + cardIndex * 0.045;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
                    }
                    transition={{ layout: { duration: 0.2 } }}
                  >
                    <KanbanContextMenu
                      applicationId={item.id}
                      company={item.company}
                      currentStatus={item.status}
                    >
                      <KanbanCard
                        id={item.id}
                        company={item.company}
                        role={item.role}
                        status={item.status as AppStatus}
                        appliedAt={item.appliedAt}
                        createdAt={item.createdAt}
                        resumeMatchScore={item.resumeMatchScore}
                        resumeMatchCriticalCount={item.resumeMatchCriticalCount}
                        onClick={() => onCardClick(item.id)}
                        entranceDelay={entranceDelay}
                      />
                    </KanbanContextMenu>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </SortableContext>
      </motion.div>
    </motion.div>
  );
}

export default function KanbanBoard({ applications }: { applications: AppItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(applications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setItems(applications);
  }, [applications]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const grouped = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = items.filter((i) => i.status === status);
      return acc;
    },
    {} as Record<AppStatus, AppItem[]>
  );

  const activeItem = items.find((i) => i.id === activeId);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const overId = over.id as string;
    const activeApp = items.find((i) => i.id === active.id);
    if (!activeApp) return;

    let targetStatus: string | undefined;
    if (KANBAN_COLUMNS.includes(overId as AppStatus)) {
      targetStatus = overId;
    } else {
      targetStatus = items.find((i) => i.id === overId)?.status;
    }

    if (targetStatus && activeApp.status !== targetStatus) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === active.id ? { ...i, status: targetStatus! } : i
        )
      );
    }
  };

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      setActiveId(null);
      const { active } = e;
      const item = items.find((i) => i.id === active.id);
      if (!item) return;

      const original = applications.find((a) => a.id === item.id);
      if (original && original.status !== item.status) {
        try {
          await fetch(`/api/applications/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: item.status }),
          });
          toast(`${item.company} → ${STATUS_LABELS[item.status as AppStatus]}`);
        } catch {
          setItems(applications);
        }
      }
    },
    [items, applications, toast]
  );

  const reducedMotion = useReducedMotion();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <motion.div
        className="rounded-2xl p-6 kanban-board-bg"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.1 }
            : { duration: 0.4, ease: "easeOut" }
        }
      >
        <div className="scroll-thin flex min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth">
          {KANBAN_COLUMNS.map((status, idx) => (
            <Column
              key={status}
              status={status}
              items={grouped[status]}
              onCardClick={(id) => router.push(`/applications/${id}`)}
              isLast={idx === KANBAN_COLUMNS.length - 1}
              columnIndex={idx}
            />
          ))}
        </div>
      </motion.div>

      <DragOverlay>
        {activeItem ? (
          <motion.div
            className="relative w-40 cursor-grabbing rounded-xl border border-[#e8e2ed] bg-white p-4 sm:w-52"
            style={{
              borderTop: `2px solid ${STATUS_ACCENT[activeItem.status as AppStatus]}`,
            }}
            initial={false}
            animate={{
              scale: reducedMotion ? 1 : 1.04,
              rotate: reducedMotion ? 0 : 1.5,
              boxShadow: "0 20px 48px rgba(203,192,211,0.45)",
            }}
            transition={{ duration: 0.15 }}
          >
            <p
              className="truncate text-[15px] italic text-[#2d2535]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {activeItem.company}
            </p>
            <p
              className="truncate text-[13px] font-light text-[#8e9aaf]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {activeItem.role}
            </p>
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
