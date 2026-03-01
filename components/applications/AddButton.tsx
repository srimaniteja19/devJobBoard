"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddModal from "./AddModal";

interface AddButtonProps {
  className?: string;
  variant?: "primary" | "nav";
}

export default function AddButton({ className, variant = "primary" }: AddButtonProps) {
  const [open, setOpen] = useState(false);

  const base =
    variant === "nav"
      ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-light text-t-muted transition-theme hover:text-t-primary"
      : "press inline-flex items-center gap-1.5 bg-accent px-4 py-2 text-[13px] font-medium text-bg transition-theme hover:bg-accent-hover";

  return (
    <>
      <button onClick={() => setOpen(true)} className={className ?? base}>
        <Plus className="h-3.5 w-3.5" />
        Add
      </button>
      <AddModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
