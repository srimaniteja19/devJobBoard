"use client";

import { useState } from "react";
import { MessageSquare, Loader2, Copy, Check, Linkedin } from "lucide-react";

interface SuggestedContact {
  name: string;
  role: string;
  reason: string;
}

interface OutreachResult {
  suggestedContacts?: SuggestedContact[];
  connectionRequest?: string;
  followUpMessage?: string;
}

interface Props {
  applicationId: string;
  company: string;
  role: string;
}

export default function LinkedInOutreachGenerator({
  applicationId,
  company,
  role,
}: Props) {
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const hasContact = contactName.trim().length > 0 || contactRole.trim().length > 0;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/linkedin-outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim() || undefined,
          contactRole: contactRole.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to generate");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore
    }
  };

  const inputCls =
    "w-full border border-edge bg-surface px-2 py-1.5 text-[13px] text-t-primary placeholder:text-t-faint focus:border-accent focus:outline-none";

  return (
    <section className="mt-6 border border-edge bg-surface p-4 sm:p-6">
      <h2 className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-3">
        <MessageSquare className="h-3.5 w-3.5" />
        Find & Message
      </h2>
      <p className="mb-4 text-[12px] font-light text-t-faint">
        Enter someone at {company} (recruiter, hiring manager, or engineer). Or leave blank to get suggestions on who to reach out to.
      </p>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">
              Name
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Jane Smith"
              className={inputCls}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-widest text-t-muted">
              Role at company
            </label>
            <input
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              placeholder="Technical Recruiter"
              className={inputCls}
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="press inline-flex items-center gap-2 border border-accent bg-transparent px-3 py-1.5 text-[12px] font-medium text-accent transition-all duration-150 hover:bg-accent/10 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating…
            </>
          ) : hasContact ? (
            <>
              <Linkedin className="h-3.5 w-3.5" />
              Generate messages
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5" />
              Suggest who to reach out to
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-[12px] font-light text-[#f87171]">{error}</p>
      )}

      {result && !loading && (
        <div className="mt-5 space-y-4 border-t border-edge pt-4">
          {result.suggestedContacts && result.suggestedContacts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Suggested contacts at {company}
              </h3>
              <div className="space-y-2">
                {result.suggestedContacts.map((c, i) => (
                  <div
                    key={i}
                    className="border border-edge bg-bg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-t-primary">{c.name}</span>
                      <span className="text-[11px] font-light text-t-muted">— {c.role}</span>
                    </div>
                    <p className="mt-1 text-[12px] font-light text-t-muted">{c.reason}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setContactName(c.name);
                        setContactRole(c.role);
                        setResult(null);
                      }}
                      className="mt-2 text-[11px] font-light text-accent transition-colors hover:text-accent-hover"
                    >
                      Use this → Generate messages
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.connectionRequest && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Connection request (300 chars)
              </h3>
              <div className="relative border border-edge bg-bg p-3">
                <p className="whitespace-pre-wrap text-[13px] font-light text-t-primary">
                  {result.connectionRequest}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.connectionRequest!, "conn")}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 border border-edge bg-surface px-2 py-1 text-[10px] font-medium text-t-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {copiedField === "conn" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedField === "conn" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {result.followUpMessage && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Follow-up message (after they accept)
              </h3>
              <div className="relative border border-edge bg-bg p-3">
                <p className="whitespace-pre-wrap text-[13px] font-light text-t-primary">
                  {result.followUpMessage}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.followUpMessage!, "follow")}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 border border-edge bg-surface px-2 py-1 text-[10px] font-medium text-t-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {copiedField === "follow" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copiedField === "follow" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
