"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookmarkPlus, Loader2, Search, Trash2, FileInput } from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";

export type CompanySnippetRow = {
  id: string;
  company: string;
  content: string;
  source: string;
  applicationId: string | null;
  createdAt: string;
};

interface Props {
  company: string;
  applicationId: string;
  /** Plain-text job notes — used for “import lines” only. */
  notesForImport?: string | null;
}

function normalizeLines(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    if (l.length > 500) continue;
    const key = l.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
    if (out.length >= 40) break;
  }
  return out;
}

export default function CompanyQuestionBank({
  company,
  applicationId,
  notesForImport,
}: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<CompanySnippetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ company });
      const res = await fetch(`/api/company-snippets?${q}`);
      if (!res.ok) throw new Error("fetch");
      const data = (await res.json()) as CompanySnippetRow[];
      setItems(data);
    } catch {
      toast("Could not load question bank");
    } finally {
      setLoading(false);
    }
  }, [company, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener("company-snippets-changed", onRefresh);
    return () => window.removeEventListener("company-snippets-changed", onRefresh);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => s.content.toLowerCase().includes(q));
  }, [items, query]);

  const handleAdd = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company-snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          content: trimmed,
          source: "manual",
          applicationId,
        }),
      });
      if (!res.ok) throw new Error("save");
      const row = (await res.json()) as CompanySnippetRow;
      setItems((prev) => [row, ...prev]);
      setDraft("");
      toast("Saved to question bank");
    } catch {
      toast("Could not save snippet");
    } finally {
      setSaving(false);
    }
  };

  const handleImportNotes = async () => {
    if (!notesForImport?.trim()) {
      toast("No notes to import");
      return;
    }
    const lines = normalizeLines(notesForImport);
    if (lines.length === 0) {
      toast("No suitable lines in notes");
      return;
    }
    setImporting(true);
    let ok = 0;
    try {
      for (const line of lines) {
        const res = await fetch("/api/company-snippets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company,
            content: line,
            source: "notes",
            applicationId,
          }),
        });
        if (res.ok) ok++;
      }
      toast(`Imported ${ok} snippet${ok === 1 ? "" : "s"} from notes`);
      await load();
    } catch {
      toast("Import failed partway");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/company-snippets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("del");
      setItems((prev) => prev.filter((s) => s.id !== id));
      toast("Removed");
    } catch {
      toast("Could not delete");
    }
  };

  return (
    <section className="border border-edge bg-surface p-4 sm:p-6">
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
            Company question bank
          </h2>
          <p className="mt-1 text-[12px] font-light text-t-faint sm:text-[13px]">
            Your questions and intel for {company}. Search while you prep; save from chat with the bookmark
            action.
          </p>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-t-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search snippets…"
            className="w-full border border-edge bg-bg py-2 pl-8 pr-3 text-[13px] font-light text-t-primary placeholder:text-t-faint focus:border-accent/50 focus:outline-none"
          />
        </div>
        {notesForImport?.trim() ? (
          <button
            type="button"
            onClick={() => void handleImportNotes()}
            disabled={importing}
            className="inline-flex items-center justify-center gap-1.5 border border-edge bg-bg px-3 py-2 text-[12px] font-medium text-t-muted transition-theme hover:border-accent/50 hover:text-t-primary disabled:opacity-50"
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileInput className="h-3.5 w-3.5" />}
            Import lines from notes
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-col gap-2 border border-edge border-dashed bg-bg/50 p-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-[11px] font-medium text-t-muted">
          Add snippet
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="e.g. How does your team handle on-call?"
            className="mt-1 w-full resize-y border border-edge bg-surface px-2.5 py-2 text-[13px] font-light text-t-primary placeholder:text-t-faint focus:border-accent/50 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving || !draft.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] font-medium text-accent transition-theme hover:bg-accent/20 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
          Save
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-t-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-[12px] font-light text-t-faint sm:text-[13px]">
          {items.length === 0
            ? "No snippets yet. Add text above or import from notes."
            : "No matches for your search."}
        </p>
      ) : (
        <ul className="max-h-[320px] space-y-2 overflow-y-auto scroll-thin-y pr-1">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="group flex gap-2 border border-edge bg-bg p-2.5 sm:p-3"
            >
              <p className="min-w-0 flex-1 whitespace-pre-wrap text-[12px] font-light leading-relaxed text-t-primary sm:text-[13px]">
                {s.content}
              </p>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-[9px] font-medium uppercase tracking-wide text-t-faint">
                  {s.source}
                </span>
                <button
                  type="button"
                  onClick={() => void handleDelete(s.id)}
                  className="rounded p-1 text-t-faint opacity-60 transition-theme hover:text-red-400 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
