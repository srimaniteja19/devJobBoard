"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Plus, FileText } from "lucide-react";
import JDExtractor from "@/components/resume/JDExtractor";
import { applicationSchema, type ApplicationFormData } from "@/lib/validations/application";
import { LOCATION_LABELS, STATUS_LABELS, KANBAN_COLUMNS, type LocationType } from "@/types";
import StackTagInput from "@/components/ui/StackTagInput";

const TYPES: LocationType[] = ["REMOTE", "HYBRID", "ONSITE"];

const RESUME_PRESETS = [
  "General",
  "Frontend",
  "Backend",
  "Full Stack",
  "DevOps",
];

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface AddModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: { company?: string; role?: string } | null;
}

export default function AddModal({ open, onClose, initialData }: AddModalProps) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [serverError, setServerError] = useState("");

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdAutoFilled, setJdAutoFilled] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      company: "",
      role: "",
      jobUrl: "",
      salary: "",
      location: "",
      type: "REMOTE",
      stack: [],
      status: "APPLIED",
      resumeLabel: "",
      appliedAt: getLocalDateString(),
      notes: "",
    },
  });

  const watchedJobUrl = watch("jobUrl");

  useEffect(() => {
    if (open) {
      reset({
        company: initialData?.company ?? "",
        role: initialData?.role ?? "",
        jobUrl: "",
        salary: "",
        location: "",
        type: "REMOTE",
        stack: [],
        status: "APPLIED",
        resumeLabel: "",
        appliedAt: getLocalDateString(),
        notes: "",
      });
      setResumeFile(null);
      setServerError("");
      setJdAutoFilled(false);
    }
  }, [open, reset, initialData]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const onSubmit = async (data: ApplicationFormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, resumeFileUrl: undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save");
      }
      const { id } = await res.json();
      if (resumeFile) {
        const fd = new FormData();
        fd.append("file", resumeFile);
        const upRes = await fetch(`/api/applications/${id}/resume`, { method: "POST", body: fd });
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({}));
          throw new Error(err.error ?? "Resume upload failed");
        }
      }
      onClose();
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-start sm:overflow-y-auto sm:p-4 sm:pt-[8vh]"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full flex-col border-t border-edge bg-surface sm:max-h-none sm:max-w-lg sm:border">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-edge px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-[14px] font-medium text-t-primary">Add Application</h2>
          <button onClick={onClose} className="p-1 text-t-faint transition-theme hover:text-t-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {serverError && (
            <p className="border border-[#3a1a1a] bg-[#1a0f0f] px-3 py-2 text-[12px] text-[#f87171]">{serverError}</p>
          )}

          <div className="grid gap-3 grid-cols-2">
            <Fld label="Company" required error={errors.company?.message}>
              <input {...register("company")} placeholder="Stripe" className={ic(errors.company)} autoFocus />
            </Fld>
            <Fld label="Role" required error={errors.role?.message}>
              <input {...register("role")} placeholder="Sr. Frontend Eng" className={ic(errors.role)} />
            </Fld>
          </div>

          <Fld label="Job URL" error={errors.jobUrl?.message}>
            <JDExtractor
              jobUrl={watchedJobUrl ?? ""}
              onJobUrlChange={(url) => setValue("jobUrl", url)}
              onExtracted={(data) => {
                setValue("company", data.company);
                setValue("role", data.jobTitle);
                setValue("location", data.location);
                setValue("type", data.type);
                setValue("salary", data.salary);
                setValue("notes", data.notes);
                if (data.techStack?.length) setValue("stack", data.techStack);
                setJdAutoFilled(true);
              }}
              disabled={false}
            />
          </Fld>

          <div className="grid gap-3 grid-cols-3">
            <Fld label="Type">
              <select {...register("type")} className={ic()}>
                {TYPES.map((t) => <option key={t} value={t}>{LOCATION_LABELS[t]}</option>)}
              </select>
            </Fld>
            <Fld label="Status">
              <select {...register("status")} className={ic()}>
                {KANBAN_COLUMNS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Fld>
            <Fld label="Applied">
              <input type="date" {...register("appliedAt")} className={ic()} />
            </Fld>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <Fld label="Location">
              <input {...register("location")} placeholder="SF, CA" className={ic()} />
            </Fld>
            <Fld label="Salary">
              <input {...register("salary")} placeholder="$120k–$160k" className={ic()} />
            </Fld>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <Fld label="Resume Label" error={errors.resumeLabel?.message}>
              <input
                {...register("resumeLabel")}
                placeholder="e.g. Frontend v2"
                list="resume-presets"
                className={ic()}
              />
              <datalist id="resume-presets">
                {RESUME_PRESETS.map((r) => <option key={r} value={r} />)}
              </datalist>
            </Fld>
            <Fld label="Resume File (optional)">
              <label className="flex cursor-pointer items-center gap-2 border border-edge bg-bg px-3 py-2 text-[13px] text-t-primary transition-theme focus-within:border-accent hover:border-edge-hover">
                <FileText className="h-3.5 w-3.5 shrink-0 text-t-faint" />
                <span className="truncate text-t-muted">
                  {resumeFile ? resumeFile.name : "PDF or DOC"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Fld>
          </div>

          <Fld label="Tech Stack" error={errors.stack?.message}>
            <Controller
              name="stack"
              control={control}
              render={({ field }) => (
                <StackTagInput value={field.value} onChange={field.onChange} />
              )}
            />
          </Fld>

          <Fld label="Notes">
            {jdAutoFilled && (
              <p className="mb-1 text-[10px] text-t-muted">
                Auto-filled from URL · Edit freely
              </p>
            )}
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Quick notes..."
              className={`${ic()} resize-y text-[13px]`}
            />
          </Fld>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-edge pt-4">
            <button type="button" onClick={onClose} className="press px-4 py-2 text-[13px] font-light text-t-muted transition-theme hover:text-t-primary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="press inline-flex items-center gap-1.5 bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent transition-theme hover:bg-accent-hover disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ic(error?: { message?: string } | null) {
  return `w-full border bg-bg px-3 py-2 text-[13px] text-t-primary placeholder:text-t-faint focus:outline-none transition-theme ${
    error ? "border-[#f87171] focus:border-[#f87171]" : "border-edge focus:border-accent"
  }`;
}

function Fld({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest text-t-muted">
        {label}{required && <span className="text-[#f87171]"> *</span>}
      </label>
      {children}
      {error && <p className="mt-0.5 text-[11px] text-[#f87171]">{error}</p>}
    </div>
  );
}
