"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteButtonProps {
  applicationId: string;
}

export default function DeleteButton({ applicationId }: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="press inline-flex items-center gap-1.5 border border-[#3a1a1a] px-3 py-1.5 text-[12px] font-medium text-[#f87171] transition-theme hover:border-[#f87171]"
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 border border-[#3a1a1a] bg-[#1a0f0f] px-3 py-1.5">
      <span className="text-[12px] text-[#f87171]">Delete?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="press inline-flex items-center gap-1 bg-[#f87171] px-2 py-0.5 text-[11px] font-medium text-white hover:bg-[#ef4444] disabled:opacity-50"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        Yes
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="text-[12px] font-medium text-[#f87171] transition-theme hover:text-t-primary"
      >
        No
      </button>
    </div>
  );
}
