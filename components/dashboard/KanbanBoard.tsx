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
import KanbanCard from "./KanbanCard";
import KanbanContextMenu from "./KanbanContextMenu";
import { useToast } from "@/components/providers/ToastProvider";
import {
  KANBAN_COLUMNS,
  STATUS_LABELS,
  STATUS_COLORS,
  type AppStatus,
} from "@/types";

interface AppItem {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedAt: string | null;
  createdAt: string;
}

function Column({
  status,
  items,
  onCardClick,
}: {
  status: AppStatus;
  items: AppItem[];
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[140px] w-44 flex-shrink-0 flex-col border-l transition-theme sm:min-h-[200px] sm:w-56 ${
        isOver ? "border-accent" : "border-edge"
      }`}
    >
      <div className="flex items-center gap-2 px-2 py-2 sm:px-3 sm:py-2.5">
        <span className="text-[10px] font-medium uppercase tracking-widest text-t-primary sm:text-[11px]">
          {STATUS_LABELS[status]}
        </span>
        <span className="bg-edge px-1.5 py-0.5 text-[9px] font-medium text-t-muted sm:text-[10px]">
          {items.length}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto px-1.5 pb-2 sm:space-y-2 sm:px-2">
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <KanbanContextMenu
              key={item.id}
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
                onClick={() => onCardClick(item.id)}
              />
            </KanbanContextMenu>
          ))}
        </SortableContext>
      </div>
    </div>
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-4 flex gap-0 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {KANBAN_COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            items={grouped[status]}
            onCardClick={(id) => router.push(`/applications/${id}`)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="w-40 border border-accent bg-surface p-3 sm:w-52 sm:p-4">
            <p className="truncate text-[13px] font-medium text-t-primary sm:text-[14px]">{activeItem.company}</p>
            <p className="truncate text-[12px] font-light text-[#777] sm:text-[13px]">{activeItem.role}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
