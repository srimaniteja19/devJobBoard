"use client";

import { useState, useEffect, useCallback } from "react";
import { StickyNote, Plus, Copy, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface QuickNote {
  id: string;
  label: string;
  content: string;
  createdAt: string | null;
}

export default function QuickApplyNotes() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/quick-apply-notes");
      const data = await res.json();
      if (res.ok && data.notes) setNotes(data.notes);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const copyNote = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setExpanded(false);
    } catch {
      // ignore
    }
  };

  const addNote = async () => {
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/quick-apply-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() || "Untitled", content: newContent.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNewLabel("");
        setNewContent("");
      }
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await fetch(`/api/quick-apply-notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-jobs-text">
          <StickyNote className="h-4 w-4 text-amber-500" />
          Quick apply notes
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-jobs-muted" /> : <ChevronDown className="h-4 w-4 text-jobs-muted" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (optional)"
              className="w-full rounded-lg border border-jobs-edge bg-jobs-card px-3 py-2 text-[13px] text-jobs-text placeholder:text-jobs-faint outline-none focus:border-jobs-accent"
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Paste a reusable snippet (e.g. cover letter intro)..."
              rows={3}
              className="w-full rounded-lg border border-jobs-edge bg-jobs-card px-3 py-2 text-[13px] text-jobs-text placeholder:text-jobs-faint outline-none focus:border-jobs-accent"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={adding || !newContent.trim()}
              className="flex items-center gap-2 rounded-lg bg-jobs-accent px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-jobs-accent-hover disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add note
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-[12px] text-jobs-faint">No notes yet. Add snippets to copy when applying.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-jobs-edge/60 bg-jobs-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-jobs-text">{n.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-jobs-muted">{n.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => copyNote(n.content)}
                      className="rounded p-1.5 text-jobs-muted hover:bg-jobs-edge hover:text-jobs-accent"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(n.id)}
                      className="rounded p-1.5 text-jobs-muted hover:bg-jobs-edge hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
