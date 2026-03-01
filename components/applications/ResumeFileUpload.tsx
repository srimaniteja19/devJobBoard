"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Loader2, Trash2 } from "lucide-react";

interface Props {
  applicationId: string;
  currentUrl: string | null;
}

export default function ResumeFileUpload({ applicationId, currentUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/resume", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = await res.json();

      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeFileUrl: url }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async () => {
    setError("");
    setLoading(true);
    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeFileUrl: null }),
      });
      router.refresh();
    } catch {} finally { setLoading(false); }
  };

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-t-muted">
        Resume File
      </label>
      {currentUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent transition-theme hover:text-accent-hover sm:text-[13px]"
          >
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            View / Download
          </a>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleUpload}
          />
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-t-faint" />
          ) : (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[11px] text-t-muted transition-theme hover:text-t-primary"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] text-t-faint transition-theme hover:text-[#f87171]"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <label className="flex cursor-pointer items-center gap-2 border border-edge bg-bg px-3 py-2 text-[12px] text-t-muted transition-theme hover:border-edge-hover sm:text-[13px]">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-t-faint" />
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 shrink-0" />
                Upload PDF or DOC (optional)
              </>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      )}
      {error && <p className="mt-0.5 text-[11px] text-[#f87171]">{error}</p>}
    </div>
  );
}
