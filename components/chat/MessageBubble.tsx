"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format, isToday, isYesterday } from "date-fns";
import { Copy, RefreshCw, ThumbsUp, ThumbsDown, BookmarkPlus } from "lucide-react";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachmentName?: string | null;
  attachmentText?: string | null;
  createdAt: Date;
  feedback?: string | null;
}

interface MessageBubbleProps {
  message: ChatMessageData;
  onCopy?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
  /** Save assistant reply to the company question bank (application page). */
  onSaveToQuestionBank?: (text: string) => void;
  isRegenerating?: boolean;
}

function formatMessageDate(d: Date): string {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  onFeedback,
  onSaveToQuestionBank,
  isRegenerating,
}: MessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!onCopy) return;
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content, onCopy]);

  const isUser = message.role === "user";

  return (
    <div
      className="group relative"
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className={isUser ? "flex justify-end" : ""}>
        <div
          className={
            isUser
              ? "max-w-[85%] rounded-xl rounded-tr-none bg-surface border border-edge px-4 py-3 text-[13px] font-light leading-[1.6] text-t-primary"
              : "max-w-[92%] rounded-xl rounded-tl-none border-l-2 border-[#e8ff4730] bg-surface px-4 py-3.5 text-[13px] font-light leading-[1.6] text-t-primary"
          }
        >
          {isUser && message.attachmentName && (
            <div className="mb-2 flex items-center gap-1.5 rounded border border-edge bg-bg px-2 py-1 text-[11px] font-light text-t-muted">
              <span>📎</span>
              <span>{message.attachmentName}</span>
            </div>
          )}
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="chat-markdown prose-invert max-w-none text-[13px] font-light leading-[1.6]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-2 mt-3 font-medium text-t-primary first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mb-1.5 mt-2 font-medium text-t-primary first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mb-1 mt-2 font-medium text-t-primary first:mt-0">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-medium">{children}</strong>,
                  ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  code: ({ className, children }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <pre className="my-2 overflow-x-auto rounded border border-edge bg-bg p-3 font-mono text-[12px] text-accent">
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code className="rounded border border-edge bg-bg px-1 py-0.5 font-mono text-[12px] text-accent">
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent pl-3 text-t-muted">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Assistant message actions: below bubble so they don't overlap content */}
      {!isUser && (onCopy || onRegenerate || onFeedback || onSaveToQuestionBank) && (
        <div className="mt-1.5 flex justify-start opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-1 rounded-lg border border-edge bg-surface/80 px-2 py-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded p-1 text-t-muted transition-colors hover:text-t-primary"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            {onSaveToQuestionBank && (
              <button
                type="button"
                onClick={() => onSaveToQuestionBank(message.content)}
                className="rounded p-1 text-t-muted transition-colors hover:text-accent"
                title="Save to question bank"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                disabled={isRegenerating}
                className="rounded p-1 text-t-muted transition-colors hover:text-t-primary disabled:opacity-50"
                title="Regenerate"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              </button>
            )}
            {onFeedback && (
              <>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, "positive")}
                  className={`rounded p-1 transition-colors ${
                    message.feedback === "positive" ? "text-accent" : "text-t-muted hover:text-t-primary"
                  }`}
                  title="Good"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(message.id, "negative")}
                  className={`rounded p-1 transition-colors ${
                    message.feedback === "negative" ? "text-red-400" : "text-t-muted hover:text-t-primary"
                  }`}
                  title="Bad"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showTimestamp && (
        <div className="mt-1.5 text-center text-[10px] font-light text-t-faint">
          {formatMessageDate(new Date(message.createdAt))} · {format(new Date(message.createdAt), "h:mm a")}
        </div>
      )}
    </div>
  );
}
