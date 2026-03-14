"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Plus,
  Video,
  FileText,
  BookOpen,
  Globe,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Link2,
} from "lucide-react";
import {
  INTERVIEW_PREP_COMPANIES,
  type CompanyInterviewData,
  type InterviewType,
} from "@/lib/interview-prep-data";
import {
  CodeInterviewIllu,
  SystemDesignIllu,
  BehavioralIllu,
  CompanyIllu,
  PrepStartIllu,
} from "@/components/interview-prep/InterviewIllustration";

/* Palette: Background #F8FAFC, Primary #6366F1, Accent #22C55E, Text #1E293B, Secondary #64748B */
const CARD_GRADIENTS = [
  "from-indigo-100/80 via-white to-indigo-50/60",
  "from-emerald-100/80 via-white to-emerald-50/60",
  "from-indigo-100/70 via-white to-emerald-50/50",
  "from-emerald-100/70 via-white to-indigo-50/50",
  "from-indigo-100/60 via-white to-emerald-50/50",
  "from-emerald-100/60 via-white to-indigo-50/50",
  "from-indigo-100/70 via-white to-emerald-100/40",
  "from-emerald-100/70 via-white to-indigo-100/40",
];

const TYPE_ICONS: Record<InterviewType, React.ReactNode> = {
  technical: <Code2 className="h-4 w-4" />,
  system_design: <Cpu className="h-4 w-4" />,
  behavioral: <MessageSquare className="h-4 w-4" />,
  culture_fit: <MessageSquare className="h-4 w-4" />,
};

const TYPE_ILLUS: Record<InterviewType, React.ComponentType<{ className?: string }>> = {
  technical: CodeInterviewIllu,
  system_design: SystemDesignIllu,
  behavioral: BehavioralIllu,
  culture_fit: BehavioralIllu,
};

const TYPE_LABELS: Record<InterviewType, string> = {
  technical: "Technical",
  system_design: "System Design",
  behavioral: "Behavioral",
  culture_fit: "Culture Fit",
};

const RESOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  course: <BookOpen className="h-4 w-4" />,
  platform: <Globe className="h-4 w-4" />,
};

const RESOURCES_STORAGE_KEY = "interview-prep-resources";

function getStorageKey(companyId?: string, company?: string, jobTitle?: string, interviewType?: InterviewType): string {
  if (jobTitle && (company || companyId)) {
    return `custom-${encodeURIComponent((company ?? companyId) ?? "")}-${encodeURIComponent(jobTitle)}`;
  }
  return `faang-${companyId ?? ""}-${interviewType ?? "technical"}`;
}

function loadResourcesFromStorage(key: string): { type: string; label: string; url: string; description?: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${RESOURCES_STORAGE_KEY}-${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveResourcesToStorage(key: string, resources: { type: string; label: string; url: string; description?: string }[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${RESOURCES_STORAGE_KEY}-${key}`, JSON.stringify(resources));
  } catch {
    // ignore
  }
}

const AI_CONTENT_STORAGE_KEY = "interview-prep-ai-content";
const CUSTOM_PREPS_STORAGE_KEY = "interview-prep-custom-preps";

function loadAiContentFromStorage(): Record<string, Record<string, unknown>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AI_CONTENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAiContentToStorage(aiContent: Record<string, Record<string, unknown>>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AI_CONTENT_STORAGE_KEY, JSON.stringify(aiContent));
  } catch {
    // ignore
  }
}

function getCustomPrepKey(company: string, jobTitle: string): string {
  return `${company.trim()}|${jobTitle.trim()}`;
}

function loadCustomPrepsFromStorage(): Record<string, CustomPrep> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOM_PREPS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCustomPrepToStorage(prep: CustomPrep) {
  const preps = loadCustomPrepsFromStorage();
  const key = getCustomPrepKey(prep.company, prep.jobTitle);
  preps[key] = prep;
  try {
    localStorage.setItem(CUSTOM_PREPS_STORAGE_KEY, JSON.stringify(preps));
  } catch {
    // ignore
  }
}

function ResourcesSection({
  companyId,
  company,
  jobTitle,
  interviewType = "technical",
}: {
  companyId?: string;
  company?: string;
  jobTitle?: string;
  interviewType?: InterviewType;
}) {
  const storageKey = getStorageKey(companyId, company, jobTitle, interviewType);
  const [resources, setResources] = useState<{ type: string; label: string; url: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResources(loadResourcesFromStorage(storageKey));
  }, [storageKey]);

  const fetchResources = useCallback(
    async (isRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/interview-prep/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            jobTitle
              ? { company: company ?? companyId, jobTitle }
              : { companyId, interviewType }
          ),
        });
        const data = await res.json();
        if (res.ok && data.resources) {
          const list = Array.isArray(data.resources) ? data.resources : [];
          setResources(list);
          saveResourcesToStorage(storageKey, list);
        } else {
          setError(data.error ?? "Failed to fetch resources");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
    }
    },
    [companyId, company, jobTitle, interviewType, storageKey]
  );

  const byType = resources.reduce(
    (acc, r) => {
      const t = (r.type || "article").toLowerCase();
      if (!acc[t]) acc[t] = [];
      acc[t].push(r);
      return acc;
    },
    {} as Record<string, { type: string; label: string; url: string; description?: string }[]>
  );

  return (
    <div className="rounded-2xl border border-prep-primary/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-prep-text-secondary">
          Up-to-date resources
        </h4>
        <div className="flex items-center gap-2">
          {resources.length > 0 && (
            <button
              type="button"
              onClick={() => fetchResources(true)}
              disabled={loading}
              title="Refresh resources"
              className="inline-flex items-center gap-1.5 rounded-lg border border-prep-primary/20 px-2.5 py-1.5 text-[11px] font-medium text-prep-text-secondary transition-colors hover:bg-prep-primary/5 hover:text-prep-text disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchResources(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-prep-accent px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-prep-accent/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {resources.length > 0 ? "Suggest new" : "Suggest resources"}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-500">{error}</p>}
      {resources.length > 0 && (
        <div className="mt-4 space-y-4">
          {(["video", "article", "course", "platform"] as const).map(
            (t) =>
              byType[t]?.length > 0 && (
                <div key={t}>
                  <h5 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase text-prep-text-secondary">
                    {RESOURCE_TYPE_ICONS[t] ?? <FileText className="h-4 w-4" />}
                    {t}
                  </h5>
                  <div className="space-y-2">
                    {byType[t].map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 rounded-lg border border-prep-primary/10 bg-prep-bg/50 p-3 transition-colors hover:bg-prep-primary/5"
                      >
                        <span className="shrink-0 text-prep-primary">
                          {RESOURCE_TYPE_ICONS[(r.type || "article").toLowerCase()] ?? <ExternalLink className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-prep-text">{r.label}</p>
                          {r.description && (
                            <p className="mt-0.5 text-[12px] text-prep-text-secondary line-clamp-2">{r.description}</p>
                          )}
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-prep-text-secondary" />
                      </a>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}

function CustomPrepView({
  prep,
  onBack,
  gradients,
  typeIllus,
}: {
  prep: CustomPrep;
  onBack: () => void;
  gradients: string[];
  typeIllus: Record<InterviewType, React.ComponentType<{ className?: string }>>;
}) {
  const [expandedType, setExpandedType] = useState<"technical" | "system_design" | "behavioral" | null>("technical");
  const types = ["technical", "system_design", "behavioral"] as const;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[14px] font-medium text-prep-text-secondary transition-colors hover:text-prep-text"
      >
        <ArrowLeft className="h-4 w-4" />
        All companies
      </button>
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-prep-primary/10 border border-prep-primary/10">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-prep-text">
                {prep.company}
              </h3>
              <p className="mt-1 text-[14px] text-prep-accent font-medium">{prep.jobTitle}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-prep-text">
                {prep.process}
              </p>
            </div>
            <div className="shrink-0 text-prep-primary">
              <CompanyIllu className="h-24 w-24" />
            </div>
          </div>
          {prep.rounds && prep.rounds.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-prep-text-secondary">
                Rounds
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {prep.rounds.map((r) => (
                  <div key={r.name} className="rounded-xl border border-prep-primary/10 bg-prep-bg/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-prep-text">{r.name}</span>
                      <span className="text-[12px] text-prep-text-secondary">{r.duration}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-prep-text-secondary">{r.description}</p>
                    {r.types?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.types.map((t) => (
                          <span key={t} className="rounded-lg bg-prep-primary/10 px-2 py-0.5 text-[11px] font-medium text-prep-primary">
                            {t.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {types.map((type, idx) => {
          const key = type === "system_design" ? "systemDesign" : type;
          const info = (prep as unknown as Record<string, unknown>)[key] as {
            summary?: string;
            topics?: string[];
            sampleQuestions?: string[];
            topTips?: string[];
            commonMistakes?: string[];
          } | undefined;
          if (!info?.summary) return null;
          const isExpanded = expandedType === type;
          const gradient = gradients[idx % gradients.length];
          const TypeIllu = typeIllus[type];
          return (
            <div
              key={type}
              className={`overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} shadow-md transition-shadow border ${
                isExpanded ? "border-prep-primary/30 ring-2 ring-prep-primary/20" : "border-prep-primary/5"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedType(isExpanded ? null : type)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/95 text-prep-primary shadow-sm">
                    <TypeIllu className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-prep-text">{TYPE_LABELS[type]}</h4>
                    <p className="mt-0.5 text-[13px] text-prep-text-secondary line-clamp-1">
                      {info.summary}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronDown className="h-5 w-5 text-prep-text-secondary" /> : <ChevronRight className="h-5 w-5 text-prep-text-secondary" />}
              </button>
              {isExpanded && (
                <div className="border-t border-prep-primary/10 bg-white/70 px-5 py-5">
                  <p className="text-[14px] text-prep-text">{info.summary}</p>
                  {(info.topics?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-prep-text-secondary">Topics</h5>
                      <p className="mt-1 text-[13px] text-prep-text">{info.topics?.join(" · ") ?? ""}</p>
                    </div>
                  )}
                  {(info.sampleQuestions?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <h5 className="text-[11px] font-semibold uppercase tracking-wider text-prep-text-secondary">Sample Questions</h5>
                      <ul className="mt-2 space-y-1">
                        {(info.sampleQuestions ?? []).map((q, i) => (
                          <li key={i} className="text-[13px] text-prep-text">• {q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(info.topTips?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <h5 className="text-[11px] font-semibold uppercase text-prep-text-secondary">Top tips</h5>
                      <ul className="mt-2 space-y-1">
                        {(info.topTips ?? []).map((t, i) => (
                          <li key={i} className="text-[13px] text-prep-text">• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(info.commonMistakes?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <h5 className="text-[11px] font-semibold uppercase text-prep-text-secondary">Common mistakes</h5>
                      <ul className="mt-2 space-y-1">
                        {(info.commonMistakes ?? []).map((m, i) => (
                          <li key={i} className="text-[13px] text-prep-text">• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {prep.resources?.length > 0 && (
        <div className="rounded-2xl border border-prep-primary/10 bg-white p-5">
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-prep-text-secondary mb-3">Resources from prep</h4>
          <div className="flex flex-wrap gap-2">
            {prep.resources.map((r, i) => (
              <a
                key={r.url || i}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-prep-primary/20 bg-prep-bg/50 px-3 py-1.5 text-[12px] font-medium text-prep-primary transition-colors hover:bg-prep-primary/10"
              >
                {r.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
      <ResourcesSection company={prep.company} jobTitle={prep.jobTitle} />
    </div>
  );
}

interface CustomPrep {
  company: string;
  jobTitle: string;
  process: string;
  rounds: { name: string; duration: string; description: string; types: string[] }[];
  technical: { summary: string; topics: string[]; sampleQuestions: string[]; topTips: string[]; commonMistakes: string[] };
  systemDesign: { summary: string; topics: string[]; sampleQuestions: string[]; topTips: string[]; commonMistakes: string[] };
  behavioral: { summary: string; sampleQuestions: string[]; topTips: string[]; commonMistakes: string[] };
  resources: { type?: string; label: string; url: string; description?: string }[];
}

export default function InterviewPrepClient() {
  const [selectedCompany, setSelectedCompany] = useState<CompanyInterviewData | null>(null);
  const [expandedType, setExpandedType] = useState<InterviewType | null>("technical");
  const [aiContent, setAiContent] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCompany, setCustomCompany] = useState("");
  const [customJobTitle, setCustomJobTitle] = useState("");
  const [customPrep, setCustomPrep] = useState<CustomPrep | null>(null);
  const [savedCustomPreps, setSavedCustomPreps] = useState<Record<string, CustomPrep>>({});
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    setAiContent(loadAiContentFromStorage());
    setSavedCustomPreps(loadCustomPrepsFromStorage());
  }, []);

  const fetchCustomPrep = async () => {
    if (!customCompany.trim() || !customJobTitle.trim()) return;
    setCustomLoading(true);
    setCustomError(null);
    try {
      const res = await fetch("/api/interview-prep/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: customCompany.trim(), jobTitle: customJobTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        saveCustomPrepToStorage(data);
        setSavedCustomPreps(loadCustomPrepsFromStorage());
        setCustomPrep(data);
        setShowCustomForm(false);
        setCustomCompany("");
        setCustomJobTitle("");
      } else {
        setCustomError(data.error ?? "Failed to generate prep");
      }
    } catch {
      setCustomError("Network error");
    } finally {
      setCustomLoading(false);
    }
  };

  const fetchAiPrep = async (companyId: string, interviewType: InterviewType, forceRefresh = false) => {
    const key = `${companyId}-${interviewType}`;
    if (!forceRefresh && aiContent[key]) return;
    setLoading(key);
    try {
      const res = await fetch("/api/interview-prep/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, interviewType }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiContent((prev) => {
          const next = { ...prev, [key]: data };
          saveAiContentToStorage(next);
          return next;
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {customPrep ? (
        <CustomPrepView
          prep={customPrep}
          onBack={() => setCustomPrep(null)}
          gradients={CARD_GRADIENTS}
          typeIllus={TYPE_ILLUS}
        />
      ) : !selectedCompany ? (
        <>
          {/* Welcome card */}
          <div className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-prep-primary/10 border border-prep-primary/10">
            <div className="flex flex-col items-center gap-6 px-8 py-12 sm:flex-row sm:justify-between sm:py-16">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold tracking-tight text-prep-text sm:text-2xl">
                  Choose a company to start
                </h2>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-prep-text-secondary">
                  Explore interview processes, prep guides, and AI-powered tips for 10 top tech companies.
                </p>
              </div>
              <div className="shrink-0 text-prep-primary">
                <PrepStartIllu />
              </div>
            </div>
          </div>

          {/* Add custom company form */}
          {showCustomForm && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-prep-primary/10 border border-prep-primary/10 p-6">
              <h3 className="text-lg font-semibold text-prep-text mb-4">Add your company</h3>
              <p className="text-[14px] text-prep-text-secondary mb-4">
                Enter any company and job title to get AI-powered interview prep.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-prep-text">Company</label>
                  <input
                    type="text"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="e.g. Notion, Figma"
                    className="w-full rounded-xl border border-prep-primary/20 bg-prep-bg/50 px-4 py-2.5 text-[14px] text-prep-text placeholder:text-prep-text-secondary/60 outline-none focus:border-prep-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-prep-text">Job title</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full rounded-xl border border-prep-primary/20 bg-prep-bg/50 px-4 py-2.5 text-[14px] text-prep-text placeholder:text-prep-text-secondary/60 outline-none focus:border-prep-primary"
                  />
                </div>
              </div>
              {customError && (
                <p className="mt-2 text-[13px] text-red-500">{customError}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={fetchCustomPrep}
                  disabled={customLoading || !customCompany.trim() || !customJobTitle.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-prep-accent px-4 py-2.5 text-[13px] font-medium text-white shadow-md transition-colors hover:bg-prep-accent/90 disabled:opacity-50"
                >
                  {customLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate prep
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomForm(false); setCustomError(null); }}
                  className="rounded-xl border border-prep-primary/20 px-4 py-2.5 text-[13px] font-medium text-prep-text-secondary transition-colors hover:bg-prep-primary/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Company grid */}
          <div>
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-prep-text-secondary">
              Companies
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => setShowCustomForm((s) => !s)}
                className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-prep-primary/30 bg-white/50 p-6 text-prep-primary transition-colors hover:border-prep-primary/50 hover:bg-prep-primary/5"
              >
                <Plus className="h-8 w-8" />
                <span className="text-[14px] font-medium">Add your company</span>
                <span className="text-[12px] text-prep-text-secondary">Custom prep for any role</span>
              </button>
              {Object.values(savedCustomPreps).map((prep, i) => {
                const gradient = CARD_GRADIENTS[(i + 1) % CARD_GRADIENTS.length];
                return (
                  <button
                    key={getCustomPrepKey(prep.company, prep.jobTitle)}
                    type="button"
                    onClick={() => setCustomPrep(prep)}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-prep-primary/15 border border-prep-primary/5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/95 text-prep-primary shadow-sm">
                        <CompanyIllu className="h-9 w-9" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-prep-text">{prep.company}</h4>
                        <p className="mt-0.5 text-[13px] text-prep-text-secondary line-clamp-2">
                          {prep.jobTitle}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {INTERVIEW_PREP_COMPANIES.map((c, i) => {
                const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCompany(c);
                      setExpandedType("technical");
                    }}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-prep-primary/15 border border-prep-primary/5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/95 text-prep-primary shadow-sm">
                        <CompanyIllu className="h-9 w-9" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-prep-text">
                          {c.name}
                        </h4>
                        <p className="mt-0.5 text-[13px] text-prep-text-secondary line-clamp-2">
                          {c.timeline} · {c.process.split("→")[0]?.trim()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Back + Company header */}
          <button
            type="button"
            onClick={() => setSelectedCompany(null)}
            className="flex items-center gap-2 text-[14px] font-medium text-prep-text-secondary transition-colors hover:text-prep-text"
          >
            <ArrowLeft className="h-4 w-4" />
            All companies
          </button>

          {/* Company overview card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-prep-primary/10 border border-prep-primary/10">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-prep-text">
                    {selectedCompany.name}
                  </h3>
                  <p className="mt-2 text-[14px] text-prep-text-secondary">
                    Timeline: {selectedCompany.timeline}
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed text-prep-text">
                    {selectedCompany.process}
                  </p>
                </div>
                <div className="shrink-0 text-prep-primary">
                  <CompanyIllu className="h-24 w-24" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-prep-text-secondary">
                  Rounds
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedCompany.rounds.map((r) => (
                    <div
                      key={r.name}
                      className="rounded-xl border border-prep-primary/10 bg-prep-bg/80 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-prep-text">{r.name}</span>
                        <span className="text-[12px] text-prep-text-secondary">{r.duration}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-prep-text-secondary">{r.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.types.map((t) => (
                          <span
                            key={t}
                            className="rounded-lg bg-prep-primary/10 px-2 py-0.5 text-[11px] font-medium text-prep-primary"
                          >
                            {TYPE_LABELS[t]}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interview type cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {(
              ["technical", "system_design", "behavioral", "culture_fit"] as const
            ).map((type, idx) => {
              const info =
                type === "culture_fit"
                  ? selectedCompany.cultureFit
                  : type === "system_design"
                    ? selectedCompany.systemDesign
                    : selectedCompany[type];
              if (!info) return null;
              const isExpanded = expandedType === type;
              const aiKey = `${selectedCompany.id}-${type}`;
              const ai = aiContent[aiKey] as {
                summary?: string;
                topTips?: string[];
                extraSampleQuestions?: string[];
                commonMistakes?: string[];
                resources?: { label: string; url: string }[];
              } | undefined;
              const isLoading = loading === aiKey;
              const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
              const TypeIllu = TYPE_ILLUS[type];

              return (
                <div
                  key={type}
                  className={`overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} shadow-md shadow-slate-200/50 transition-shadow dark:shadow-slate-900/50 ${
                    isExpanded ? "ring-2 ring-indigo-300/60 dark:ring-indigo-500/40" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-white/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/95 text-prep-primary shadow-sm">
                        <TypeIllu className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-prep-text">{info.name}</h4>
                        <p className="mt-0.5 text-[13px] text-prep-text-secondary line-clamp-1">
                          {info.description}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-prep-text-secondary" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-prep-text-secondary" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="border-t border-prep-primary/10 bg-white/70 px-5 py-5">
                      <p className="text-[14px] text-prep-text">{info.description}</p>
                      <div className="mt-4">
                        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-prep-text-secondary">
                          Topics
                        </h5>
                        <p className="mt-1 text-[13px] text-prep-text">
                          {info.topics.join(" · ")}
                        </p>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-prep-text-secondary">
                          Sample Questions
                        </h5>
                        <ul className="mt-2 space-y-1">
                          {info.sampleQuestions.map((q, i) => (
                            <li key={i} className="text-[13px] text-prep-text">
                              • {q}
                            </li>
                          ))}
                          {ai?.extraSampleQuestions?.map((q, i) => (
                            <li key={`ai-${i}`} className="text-[13px] text-prep-text">
                              • {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {info.resources && info.resources.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-[11px] font-semibold uppercase tracking-wider text-prep-text-secondary">
                            Resources
                          </h5>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {info.resources.map((r) => (
                              <a
                                key={r.url}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-prep-primary/20 bg-white px-3 py-1.5 text-[12px] font-medium text-prep-primary transition-colors hover:bg-prep-primary/10"
                              >
                                {r.label}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                            {ai?.resources?.map((r: { label: string; url: string }, i: number) => (
                              <a
                                key={`ai-${i}`}
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-prep-primary/20 bg-white px-3 py-1.5 text-[12px] font-medium text-prep-primary transition-colors hover:bg-prep-primary/10"
                              >
                                {r.label}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => fetchAiPrep(selectedCompany.id, type, !!ai)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-prep-accent px-4 py-2.5 text-[13px] font-medium text-white shadow-md transition-colors hover:bg-prep-accent/90 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          {ai ? "Refresh AI tips" : "Get AI prep tips"}
                        </button>
                        {ai && (
                          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                              <Sparkles className="h-4 w-4 text-prep-primary" />
                              <span className="text-[12px] font-semibold uppercase tracking-wider text-prep-text-secondary">
                                AI prep
                              </span>
                            </div>
                            {ai.summary && (
                              <div className="mb-5">
                                <p className="text-[13px] leading-relaxed text-prep-text">
                                  {ai.summary}
                                </p>
                              </div>
                            )}
                            {ai.topTips && ai.topTips.length > 0 && (
                              <div className="mb-5">
                                <h5 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  <Lightbulb className="h-3.5 w-3.5" />
                                  Top tips
                                </h5>
                                <div className="space-y-2.5">
                                  {ai.topTips.map((t, i) => (
                                    <div
                                      key={i}
                                      className="rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                                    >
                                      <span className="mb-1.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">
                                        {i + 1}
                                      </span>
                                      <p className="text-[13px] leading-relaxed text-prep-text">{t}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {ai.extraSampleQuestions && ai.extraSampleQuestions.length > 0 && (
                              <div className="mb-5">
                                <h5 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  <HelpCircle className="h-3.5 w-3.5" />
                                  Sample questions
                                </h5>
                                <div className="space-y-2">
                                  {ai.extraSampleQuestions.map((q, i) => (
                                    <div
                                      key={i}
                                      className="rounded-lg border border-slate-100 bg-slate-50/50 px-3.5 py-2.5"
                                    >
                                      <p className="text-[12px] text-prep-text">{q}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {ai.commonMistakes && ai.commonMistakes.length > 0 && (
                              <div className="mb-5">
                                <h5 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Mistakes to avoid
                                </h5>
                                <div className="space-y-2">
                                  {ai.commonMistakes.map((m, i) => (
                                    <div
                                      key={i}
                                      className="rounded-lg border border-amber-100 bg-amber-50/40 px-3.5 py-2.5"
                                    >
                                      <p className="text-[12px] text-prep-text">{m}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {ai.resources && ai.resources.length > 0 && (
                              <div>
                                <h5 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  <Link2 className="h-3.5 w-3.5" />
                                  Resources
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {ai.resources.map((r: { label: string; url: string; type?: string }, i: number) => (
                                    <a
                                      key={i}
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-prep-primary hover:bg-slate-50"
                                    >
                                      {r.label}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Suggest up-to-date resources */}
          <ResourcesSection
            companyId={selectedCompany.id}
            interviewType={expandedType ?? "technical"}
          />
        </div>
      )}
    </div>
  );
}
