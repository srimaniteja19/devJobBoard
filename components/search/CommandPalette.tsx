"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "@/components/providers/SearchProvider";
import { STATUS_LABELS, STATUS_COLORS, type AppStatus } from "@/types";

interface Result {
  id: string;
  company: string;
  role: string;
  status: string;
}

export default function CommandPalette() {
  const { open, setOpen } = useSearch();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSelected(0);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (fetchRef.current) clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(() => doSearch(query), 150);
    return () => { if (fetchRef.current) clearTimeout(fetchRef.current); };
  }, [query, doSearch]);

  const navigate = useCallback((id: string) => {
    setOpen(false);
    router.push(`/applications/${id}`);
  }, [setOpen, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && results[selected]) { navigate(results[selected].id); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/80 pt-[15vh] backdrop-blur-sm sm:pt-[20vh]"
      onClick={(e) => { if (e.target === overlayRef.current) setOpen(false); }}
    >
      <div className="mx-4 w-full max-w-[560px] border border-edge bg-surface">
        <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-t-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search companies, roles, stack..."
            className="w-full bg-transparent text-[14px] text-t-primary placeholder:text-t-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 border border-edge bg-bg px-1.5 py-0.5 text-[10px] text-t-faint sm:inline">ESC</kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {query && results.length === 0 && !loading && (
            <p className="px-4 py-8 text-center text-[13px] text-t-faint">No results</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => navigate(r.id)}
              onMouseEnter={() => setSelected(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-all ${
                i === selected ? "bg-bg" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="text-[13px] font-medium text-t-primary">{r.company}</span>
                <span className="ml-2 text-[12px] font-light text-[#777]">{r.role}</span>
              </div>
              <span className={`shrink-0 text-[11px] font-medium ${STATUS_COLORS[r.status as AppStatus] ?? "text-t-muted"}`}>
                {STATUS_LABELS[r.status as AppStatus] ?? r.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
