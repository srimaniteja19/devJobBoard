"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import AddModal from "./AddModal";

interface AddButtonProps {
  className?: string;
  variant?: "primary" | "nav" | "mobile";
}

export default function AddButton({ className, variant = "primary" }: AddButtonProps) {
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<{ company?: string; role?: string } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const add = searchParams.get("add");
    const company = searchParams.get("company");
    const role = searchParams.get("role");
    if (add === "1" && (company || role)) {
      setInitialData({ company: company ?? undefined, role: role ?? undefined });
      setOpen(true);
    }
  }, [searchParams]);

  const styles = {
    nav: "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-light text-t-muted transition-theme hover:text-t-primary",
    primary: "press inline-flex items-center gap-1.5 bg-accent px-4 py-2 text-[13px] font-medium text-on-accent transition-theme hover:bg-accent-hover",
    mobile: "flex flex-col items-center gap-0.5 text-[10px] font-light text-t-muted transition-theme",
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={className ?? styles[variant]}>
        <Plus className={variant === "mobile" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        Add
      </button>
      <AddModal
        open={open}
        onClose={() => {
          setOpen(false);
          setInitialData(null);
        }}
        initialData={initialData}
      />
    </>
  );
}
