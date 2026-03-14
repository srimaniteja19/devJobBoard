"use client";

import { useState, useCallback } from "react";
import { Shuffle } from "lucide-react";

const PREF_STORAGE_KEY = "devjobboard-which-job-preferences";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  summary?: string;
}

interface WhichJobFirstProps {
  jobs: Job[];
  onPreference?: (chosenId: string, otherId: string) => void;
}

function loadPreferences(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

function savePreferences(prefs: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs.slice(-50)));
  } catch {
    // ignore
  }
}

export default function WhichJobFirst({ jobs, onPreference }: WhichJobFirstProps) {
  const [pair, setPair] = useState<[Job, Job] | null>(null);

  const pickTwo = useCallback(() => {
    if (jobs.length < 2) {
      setPair(null);
      return;
    }
    const shuffled = [...jobs].sort(() => Math.random() - 0.5);
    setPair([shuffled[0], shuffled[1]]);
  }, [jobs]);

  const choose = (chosen: Job, other: Job) => {
    const prefs = loadPreferences();
    if (!prefs.includes(chosen.id)) {
      prefs.push(chosen.id);
      savePreferences(prefs);
    }
    onPreference?.(chosen.id, other.id);
    pickTwo();
  };

  if (jobs.length < 2) return null;

  return (
    <div className="rounded-2xl border border-jobs-edge/50 bg-jobs-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-jobs-text">
          Which job first?
        </h2>
        <button
          type="button"
          onClick={pickTwo}
          className="flex items-center gap-1.5 rounded-lg border border-jobs-edge px-2.5 py-1.5 text-[11px] font-medium text-jobs-muted transition-colors hover:border-jobs-accent hover:text-jobs-accent"
        >
          <Shuffle className="h-3.5 w-3.5" /> Pick two
        </button>
      </div>
      {!pair ? (
        <p className="text-[12px] text-jobs-faint">
          Click &quot;Pick two&quot; to see two random jobs. Choose one to refine your preferences.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {pair.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => choose(job, pair[0] === job ? pair[1] : pair[0])}
              className="rounded-xl border border-jobs-edge bg-jobs-card p-4 text-left transition-all hover:border-jobs-accent hover:shadow-md"
            >
              <p className="line-clamp-2 text-[13px] font-semibold text-jobs-text">{job.title}</p>
              <p className="mt-1 text-[12px] text-jobs-muted">{job.company}</p>
              {job.summary && (
                <p className="mt-1 line-clamp-1 text-[11px] text-jobs-faint">{job.summary}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
