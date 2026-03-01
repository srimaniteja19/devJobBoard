"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Paperclip, Lightbulb, Send, Loader2 } from "lucide-react";
import { extractTextFromFile } from "@/lib/chat-attachment-extract";

const QUICK_PILLS: { label: string; message: (role: string, company: string) => string }[] = [
  {
    label: "📝 Cover Letter",
    message: (role, company) =>
      `Write a tailored cover letter for this ${role} position at ${company} based on my resume and the JD`,
  },
  {
    label: "💰 Negotiate",
    message: () =>
      "Help me negotiate the salary for this role. What should I ask for?",
  },
  {
    label: "❓ Mock Interview",
    message: () =>
      "Start a mock interview for this role. Ask me questions one at a time and give feedback on my answers.",
  },
  {
    label: "📧 Follow-up Email",
    message: (role, company) =>
      `Write a follow-up email to send after applying to ${company} for the ${role} position`,
  },
  {
    label: "⭐ STAR Story",
    message: () =>
      "Help me write a STAR format story relevant to this role",
  },
];

interface ChatInputProps {
  role: string;
  company: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  onSend: (message: string, attachment?: { name: string; text: string }) => void;
  showSuggestions: boolean;
  onToggleSuggestions: () => void;
  mockInterviewMode?: boolean;
}

export function ChatInput({
  role,
  company,
  placeholder = "Ask anything about this job...",
  disabled,
  loading,
  onSend,
  showSuggestions,
  onToggleSuggestions,
  mockInterviewMode,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null);
  const [extracting, setExtracting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (value.trim() || attachment) && !disabled && !loading;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSubmit();
    }
  };

  const handleSubmit = () => {
    const text = value.trim();
    if (!text && !attachment) return;
    if (!canSend) return;

    const messageToSend = text || (attachment ? "See attached file." : "");
    onSend(messageToSend, attachment ?? undefined);
    setValue("");
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const allowed =
      name.endsWith(".pdf") ||
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      name.endsWith(".txt");

    if (!allowed) {
      alert("Please choose a PDF, DOCX, or TXT file.");
      return;
    }

    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setAttachment({ name: file.name, text });
    } catch (err) {
      console.error(err);
      alert("Could not read file. Try a different file.");
    } finally {
      setExtracting(false);
      e.target.value = "";
    }
  };

  const removeAttachment = () => setAttachment(null);

  const sendQuickPill = (getMessage: (role: string, company: string) => string) => {
    const msg = getMessage(role, company);
    onSend(msg);
  };

  return (
    <div className="border-t border-edge bg-surface px-5 py-4">
      {/* Quick action pills */}
      <div className="mb-4 flex gap-3 overflow-x-auto scroll-thin pb-1">
        {QUICK_PILLS.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={() => sendQuickPill(pill.message)}
            disabled={disabled || loading}
            className="shrink-0 rounded-full border border-edge bg-bg px-3 py-1.5 text-[12px] font-light text-t-muted transition-colors hover:border-edge-hover hover:text-t-muted"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Attachment chip */}
      {attachment && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-edge bg-bg px-3 py-2 text-[12px] font-light text-t-muted">
          <span className="flex items-center gap-1.5">
            <span>📎</span>
            <span>{attachment.name}</span>
          </span>
          <button
            type="button"
            onClick={removeAttachment}
            className="text-t-faint hover:text-t-primary"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mockInterviewMode ? "Type your answer..." : placeholder}
          disabled={disabled || loading}
          rows={1}
          className="min-h-[48px] max-h-[160px] flex-1 resize-none rounded-lg border border-edge bg-bg px-3.5 py-3 text-[13px] font-light text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none focus:ring-0 disabled:opacity-50"
          style={{ minHeight: 48 }}
        />
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || loading || extracting}
            className="rounded-lg p-2.5 text-t-muted transition-colors hover:text-t-primary disabled:opacity-50"
            title="Attach file"
          >
            {extracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleSuggestions}
            className="rounded-lg p-2.5 text-t-muted transition-colors hover:text-t-primary"
            title="Suggestions"
          >
            <Lightbulb className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-bg transition-colors hover:bg-accent-hover disabled:opacity-30 disabled:hover:bg-accent"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>

      {value.length > 500 && (
        <div className="mt-1 text-right text-[12px] font-light text-t-faint">
          {value.length} characters
        </div>
      )}
    </div>
  );
}
