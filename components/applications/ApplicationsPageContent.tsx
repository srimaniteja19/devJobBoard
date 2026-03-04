"use client";

import { useState } from "react";
import ApplicationsTable from "./ApplicationsTable";
import ApplicationsCardView from "./ApplicationsCardView";
import ApplicationsViewSwitcher from "./ApplicationsViewSwitcher";

interface AppRow {
  id: string;
  company: string;
  role: string;
  status: string;
  location: string | null;
  stack: string;
  resumeLabel: string | null;
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  applications: AppRow[];
}

export default function ApplicationsPageContent({ applications }: Props) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <ApplicationsViewSwitcher mode={viewMode} onModeChange={setViewMode} />
      </div>
      {viewMode === "table" ? (
        <ApplicationsTable applications={applications} />
      ) : (
        <ApplicationsCardView applications={applications} />
      )}
    </div>
  );
}
