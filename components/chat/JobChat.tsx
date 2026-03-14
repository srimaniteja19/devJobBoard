"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, FileText, FileStack, RotateCcw, MessageCircle, X } from "lucide-react";
import { MessageBubble, type ChatMessageData } from "./MessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { ChatInput } from "./ChatInput";
import type { AppStatus } from "@/types";
import { format, isToday, isYesterday } from "date-fns";

const NAVBAR_HEIGHT = 48;

interface JobChatProps {
  applicationId: string;
  role: string;
  company: string;
  status: AppStatus | string;
  hasResume: boolean;
  hasJd: boolean;
  onUploadResume?: () => void;
  onPasteJd?: () => void;
  /** "panel" = side panel + FAB (default). "inline" = block below content, no side/FAB */
  variant?: "panel" | "inline";
}

function parseMessage(m: { id: string; role: string; content: string; attachmentName?: string | null; attachmentText?: string | null; feedback?: string | null; createdAt: Date }): ChatMessageData {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    attachmentName: m.attachmentName ?? undefined,
    attachmentText: m.attachmentText ?? undefined,
    createdAt: new Date(m.createdAt),
    feedback: m.feedback ?? undefined,
  };
}

function DateSeparator({ date }: { date: Date }) {
  const label = isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy");
  return (
    <div className="flex items-center gap-4 py-4">
      <span className="h-px flex-1 bg-edge" />
      <span className="text-[11px] font-light text-t-faint">{label}</span>
      <span className="h-px flex-1 bg-edge" />
    </div>
  );
}

export default function JobChat({
  applicationId,
  role,
  company,
  status,
  hasResume,
  hasJd,
  onUploadResume,
  onPasteJd,
  variant = "panel",
}: JobChatProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mockInterviewMode, setMockInterviewMode] = useState(false);
  const [hasResumeLocal, setHasResumeLocal] = useState(hasResume);
  const [hasJdLocal, setHasJdLocal] = useState(hasJd);
  const [pasteJdOpen, setPasteJdOpen] = useState(false);
  const [pasteJdValue, setPasteJdValue] = useState("");
  const [savingJd, setSavingJd] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasResumeLocal(hasResume);
    setHasJdLocal(hasJd);
  }, [hasResume, hasJd]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/chat`);
      if (!res.ok) throw new Error("Failed to load chat");
      const data = await res.json();
      setMessages(data.map(parseMessage));
    } catch (e) {
      setError("Could not load chat.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const sendMessage = useCallback(
    async (message: string, attachment?: { name: string; text: string }) => {
      if (!message.trim() && !attachment) return;

      const userMessage: ChatMessageData = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        attachmentName: attachment?.name,
        attachmentText: attachment?.text,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setSending(true);
      setError(null);
      setShowSuggestions(false);

      if (message.toLowerCase().includes("mock interview") && message.toLowerCase().includes("start")) {
        setMockInterviewMode(true);
      }

      try {
        const body: { message: string; attachmentText?: string; attachmentName?: string } = {
          message: message.trim(),
        };
        if (attachment) {
          body.attachmentText = attachment.text;
          body.attachmentName = attachment.name;
        }

        const res = await fetch(`/api/applications/${applicationId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Send failed");
        }

        const data = await res.json();
        const assistantMessage: ChatMessageData = {
          id: `temp-assistant-${Date.now()}`,
          role: "assistant",
          content: data.response ?? "",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        await fetchMessages();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      } finally {
        setSending(false);
      }
    },
    [applicationId, fetchMessages]
  );

  const clearChat = useCallback(async () => {
    if (!confirm("Clear all messages in this chat?")) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}/chat`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMessages([]);
      setShowSuggestions(true);
      setMockInterviewMode(false);
    } catch {
      setError("Could not clear chat.");
    }
  }, [applicationId]);

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg || msg.role !== "assistant") return;
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      if (!lastUser) return;

      setSending(true);
      setError(null);
      try {
        const body: { message: string; regenerateMessageId: string; attachmentText?: string; attachmentName?: string } = {
          message: lastUser.content,
          regenerateMessageId: messageId,
        };
        if (lastUser.attachmentText && lastUser.attachmentName) {
          body.attachmentText = lastUser.attachmentText;
          body.attachmentName = lastUser.attachmentName;
        }
        const res = await fetch(`/api/applications/${applicationId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Regenerate failed");
        await fetchMessages();
      } catch {
        setError("Regenerate failed.");
      } finally {
        setSending(false);
      }
    },
    [applicationId, messages, fetchMessages]
  );

  const handleFeedback = useCallback(
    async (messageId: string, feedback: "positive" | "negative") => {
      try {
        await fetch(`/api/applications/${applicationId}/chat`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, feedback }),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
        );
      } catch {
        // ignore
      }
    },
    [applicationId]
  );

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const endMockInterview = useCallback(() => {
    sendMessage("End the mock interview and give me an overall assessment");
    setMockInterviewMode(false);
  }, [sendMessage]);

  const triggerResumeUpload = useCallback(() => {
    if (onUploadResume) {
      onUploadResume();
    } else {
      resumeInputRef.current?.click();
    }
  }, [onUploadResume]);

  const handleResumeFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingResume(true);
      try {
        const formData = new FormData();
        formData.set("file", file);
        const res = await fetch(`/api/applications/${applicationId}/resume`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) setHasResumeLocal(true);
      } finally {
        setUploadingResume(false);
        e.target.value = "";
      }
    },
    [applicationId]
  );

  const openPasteJd = useCallback(() => {
    if (onPasteJd) {
      onPasteJd();
    } else {
      setPasteJdValue("");
      setPasteJdOpen(true);
    }
  }, [onPasteJd]);

  const savePasteJd = useCallback(async () => {
    setSavingJd(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: pasteJdValue.trim() || null }),
      });
      if (res.ok) {
        setHasJdLocal(true);
        setPasteJdOpen(false);
      }
    } finally {
      setSavingJd(false);
    }
  }, [applicationId, pasteJdValue]);

  const getDateKey = (d: Date) => format(d, "yyyy-MM-dd");

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge bg-surface px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="font-medium text-t-primary">Job Coach</span>
              {mockInterviewMode && (
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                  🎙️ Mock Interview
                </span>
              )}
            </div>
            <p className="text-[12px] font-light text-t-muted">
              {role} at {company}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded p-1 text-t-muted"
            title={hasResumeLocal ? "Resume loaded" : "No resume"}
          >
            <FileText className={`h-4 w-4 ${hasResumeLocal ? "text-green-500" : ""}`} />
          </span>
          <span
            className="rounded p-1 text-t-muted"
            title={hasJdLocal ? "JD loaded" : "No JD"}
          >
            <FileStack className={`h-4 w-4 ${hasJdLocal ? "text-green-500" : ""}`} />
          </span>
          {mockInterviewMode && (
            <button
              type="button"
              onClick={endMockInterview}
              className="rounded px-2 py-1 text-[11px] font-medium text-red-400 hover:bg-red-500/10"
            >
              End Interview
            </button>
          )}
          <button
            type="button"
            onClick={clearChat}
            className="rounded p-1.5 text-t-muted transition-colors hover:text-t-primary"
            title="Clear chat"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          {variant === "panel" && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded p-1.5 text-t-muted transition-colors hover:text-t-primary md:block hidden"
              title="Collapse"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded p-1.5 text-t-muted transition-colors hover:text-t-primary md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Context banner */}
      {(!hasResumeLocal || !hasJdLocal) && (
        <div className="border-b border-edge bg-amber-500/10 px-5 py-3">
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={handleResumeFileChange}
          />
          {!hasResumeLocal && (
            <div className="flex flex-wrap items-center gap-2 py-1">
              <span className="text-[12px] font-light text-amber-200">
                Attach your resume so I can give personalized advice
              </span>
              <button
                type="button"
                onClick={triggerResumeUpload}
                disabled={uploadingResume}
                className="rounded border border-amber-500/50 px-2 py-0.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
              >
                {uploadingResume ? "Uploading…" : "Upload Resume"}
              </button>
            </div>
          )}
          {!hasJdLocal && (
            <div className="flex flex-wrap items-center gap-2 py-1">
              <span className="text-[12px] font-light text-amber-200">
                Paste the job description so I can tailor my help
              </span>
              <button
                type="button"
                onClick={openPasteJd}
                className="rounded border border-amber-500/50 px-2 py-0.5 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20"
              >
                Paste JD
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paste JD modal */}
      {pasteJdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-edge bg-surface p-4">
            <h3 className="mb-2 font-medium text-t-primary">Paste job description</h3>
            <textarea
              value={pasteJdValue}
              onChange={(e) => setPasteJdValue(e.target.value)}
              placeholder="Paste the full job description here..."
              className="mb-3 min-h-[200px] w-full resize-y rounded border border-edge bg-bg px-3 py-2 text-[13px] font-light text-t-primary placeholder:text-t-faint"
              rows={8}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteJdOpen(false)}
                className="rounded border border-edge px-3 py-1.5 text-[12px] font-light text-t-muted hover:bg-edge"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePasteJd}
                disabled={savingJd}
                className="rounded bg-accent px-3 py-1.5 text-[12px] font-medium text-on-accent disabled:opacity-50"
              >
                {savingJd ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scroll-thin-y px-5 py-6"
        style={{ minHeight: 0 }}
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 w-3/4 animate-shimmer rounded-lg bg-surface"
                style={{ width: i === 2 ? "60%" : "85%" }}
              />
            ))}
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <SuggestedPrompts
                status={status}
                company={company}
                role={role}
                onSelect={sendMessage}
                visible={showSuggestions}
              />
            )}
            {messages.length > 0 && (
              <div className="space-y-5">
                {(() => {
                  let lastDate = "";
                  return messages.map((msg) => {
                    const dateKey = getDateKey(msg.createdAt);
                    const showDate = dateKey !== lastDate;
                    if (showDate) lastDate = dateKey;
                    return (
                      <div key={msg.id}>
                        {showDate && <DateSeparator date={msg.createdAt} />}
                        <div className="mt-3 first:mt-0">
                          <MessageBubble
                            message={msg}
                            onCopy={handleCopy}
                            onRegenerate={msg.role === "assistant" ? handleRegenerate : undefined}
                            onFeedback={msg.role === "assistant" ? handleFeedback : undefined}
                            isRegenerating={sending}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            {messages.length > 0 && showSuggestions && (
              <div className="mt-6 border-t border-edge pt-5">
                <SuggestedPrompts
                  status={status}
                  company={company}
                  role={role}
                  onSelect={sendMessage}
                  visible
                />
              </div>
            )}
            {sending && (
              <div className="mt-5 flex">
                <div className="rounded-xl rounded-tl-none border-l-2 border-[#e8ff4730] bg-surface px-4 py-3.5">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-t-muted animate-chat-typing" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-t-muted animate-chat-typing" style={{ animationDelay: "200ms" }} />
                    <span className="h-2 w-2 rounded-full bg-t-muted animate-chat-typing" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                Something went wrong.{" "}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="underline hover:no-underline"
                >
                  Try again →
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {!loading && (
        <ChatInput
          role={role}
          company={company}
          disabled={loading}
          loading={sending}
          onSend={sendMessage}
          showSuggestions={showSuggestions}
          onToggleSuggestions={() => setShowSuggestions((s) => !s)}
          mockInterviewMode={mockInterviewMode}
        />
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div
        className="flex flex-col overflow-hidden rounded-lg border border-edge bg-bg"
        style={{ minHeight: 480, height: 520 }}
      >
        {panelContent}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: sticky right panel or collapsed strip */}
      <div
        className="hidden md:flex md:flex-col md:sticky md:border-l md:border-edge md:bg-bg"
        style={{
          top: NAVBAR_HEIGHT,
          height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
          width: collapsed ? 48 : "40%",
          minWidth: collapsed ? 48 : 280,
        }}
      >
        {collapsed ? (
          <div className="flex h-full flex-col items-center justify-center border-l border-edge bg-surface">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="flex flex-col items-center gap-1 p-2 text-t-muted transition-colors hover:text-accent"
              title="Open chat"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px]">Chat</span>
            </button>
          </div>
        ) : (
          panelContent
        )}
      </div>

      {/* Mobile: FAB + bottom sheet */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition-transform hover:scale-105"
          title="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          {messages.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-edge bg-bg md:hidden"
            style={{ height: "85vh" }}
          >
            <div className="flex justify-center py-2">
              <div className="h-1 w-12 rounded-full bg-edge" />
            </div>
            {panelContent}
          </div>
        </>
      )}
    </>
  );
}
