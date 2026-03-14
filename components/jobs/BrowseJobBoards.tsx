"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Globe } from "lucide-react";

type WorkType = "remote" | "hybrid" | "onsite";
type ExperienceFilterKey = "any" | "0-1" | "1-3" | "1-5" | "3-5" | "5+";

interface BrowseJobBoardsProps {
  searchQuery?: string;
  workTypes?: WorkType[];
  experience?: ExperienceFilterKey;
  usaOnly?: boolean;
}

const JOB_BOARDS = [
  {
    name: "Y Combinator",
    description: "Work at a Startup — YC-backed companies",
    url: "https://www.workatastartup.com/jobs/l/software-engineer",
    color: "text-orange-600 hover:text-orange-700",
  },
  {
    name: "Wellfound",
    description: "Startup jobs (formerly AngelList)",
    url: "https://wellfound.com/jobs",
    color: "text-blue-600 hover:text-blue-700",
  },
  {
    name: "Levels.fyi",
    description: "Tech jobs with compensation data",
    url: "https://www.levels.fyi/jobs",
    color: "text-emerald-600 hover:text-emerald-700",
  },
  {
    name: "Remotive",
    description: "Remote jobs",
    url: "https://remotive.com/remote-jobs/software-dev",
    color: "text-violet-600 hover:text-violet-700",
  },
  {
    name: "We Work Remotely",
    description: "Remote programming jobs",
    url: "https://weworkremotely.com/categories/2-programming",
    color: "text-teal-600 hover:text-teal-700",
  },
  {
    name: "LinkedIn Jobs",
    description: "Professional network jobs",
    getUrl: (q?: string) =>
      q
        ? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}`
        : "https://www.linkedin.com/jobs/",
    color: "text-[#0a66c2] hover:text-[#004182]",
  },
  {
    name: "Indeed",
    description: "Job search",
    getUrl: (q?: string) =>
      `https://www.indeed.com/jobs?q=${encodeURIComponent(q || "software engineer")}`,
    color: "text-indigo-600 hover:text-indigo-700",
  },
];

export default function BrowseJobBoards({
  searchQuery = "",
  workTypes = ["remote", "hybrid", "onsite"],
  experience = "1-5",
  usaOnly = true,
}: BrowseJobBoardsProps) {
  const [expanded, setExpanded] = useState(false);
  const q = searchQuery.trim() || "software engineer";

  return (
    <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-jobs-accent" />
          <span className="text-[13px] font-semibold text-jobs-text">
            Browse job boards
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-jobs-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-jobs-muted" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] text-jobs-faint">
            Open with your current search: &quot;{q}&quot;
            {workTypes.includes("remote") && " · Remote"}
            {usaOnly && " · USA"}
          </p>
          <div className="space-y-1.5">
            {JOB_BOARDS.map((board) => {
              const url =
                "getUrl" in board
                  ? (board as { getUrl: (q: string) => string }).getUrl(q)
                  : (board as { url: string }).url;
              return (
                <a
                  key={board.name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between rounded-lg border border-jobs-edge/60 px-3 py-2.5 text-left transition-colors hover:border-jobs-accent/50 hover:bg-jobs-accent/5 ${board.color}`}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium">{board.name}</p>
                    <p className="truncate text-[10px] text-jobs-faint">
                      {board.description}
                    </p>
                  </div>
                  <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
