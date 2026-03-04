"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import EditApplicationModal from "./EditApplicationModal";

interface ApplicationForEdit {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  location: string | null;
  type: string;
  salary: string | null;
  status: string;
  appliedAt: Date | null;
  stack: string;
  notes: string | null;
  resumeLabel: string | null;
}

export default function EditApplicationButton({ application }: { application: ApplicationForEdit }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded border border-edge bg-bg px-3 py-2 text-[12px] font-medium text-t-muted transition-theme hover:border-edge-hover hover:text-t-primary sm:px-3.5 sm:py-2 sm:text-[13px]"
        aria-label="Edit application"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
      <EditApplicationModal
        applicationId={application.id}
        open={open}
        onClose={() => setOpen(false)}
        initialData={{
          company: application.company,
          role: application.role,
          jobUrl: application.jobUrl,
          location: application.location,
          type: application.type,
          salary: application.salary,
          status: application.status,
          appliedAt: application.appliedAt,
          stack: application.stack,
          notes: application.notes,
          resumeLabel: application.resumeLabel,
        }}
      />
    </>
  );
}
