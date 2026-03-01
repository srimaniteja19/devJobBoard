"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import JDExtractor, { type ExtractedJD } from "@/components/resume/JDExtractor";

interface ApplicationJDExtractorProps {
  applicationId: string;
  jobUrl: string | null;
  initialNotes: string | null;
}

export default function ApplicationJDExtractor({
  applicationId,
  jobUrl,
  initialNotes,
}: ApplicationJDExtractorProps) {
  const router = useRouter();
  const [url, setUrl] = useState(jobUrl ?? "");
  const [pastedNotes, setPastedNotes] = useState(initialNotes ?? "");

  useEffect(() => {
    setPastedNotes(initialNotes ?? "");
  }, [initialNotes]);

  const handleSaveExtracted = async (data: ExtractedJD) => {
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: data.company,
        role: data.jobTitle,
        location: data.location,
        type: data.type,
        salary: data.salary,
        notes: data.notes,
        stack: data.techStack,
      }),
    });
    router.refresh();
  };

  const handleSavePastedNotes = async (notes: string) => {
    await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    router.refresh();
  };

  return (
    <div className="mb-4">
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-t-muted">
        Extract JD from URL
      </label>
      <JDExtractor
        jobUrl={url}
        onJobUrlChange={setUrl}
        onExtracted={() => {}}
        onSaveExtracted={handleSaveExtracted}
        showNotesFallback
        notesValue={pastedNotes}
        onNotesChange={setPastedNotes}
        onSavePastedNotes={handleSavePastedNotes}
      />
    </div>
  );
}
