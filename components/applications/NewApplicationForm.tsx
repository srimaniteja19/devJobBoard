"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { applicationSchema, type ApplicationFormData } from "@/lib/validations/application";
import { LOCATION_LABELS, STATUS_LABELS, KANBAN_COLUMNS, type LocationType } from "@/types";
import StackTagInput from "@/components/ui/StackTagInput";
import { toYMDLocal } from "@/lib/date-helpers";

const LOCATION_TYPES: LocationType[] = ["REMOTE", "HYBRID", "ONSITE"];

export default function NewApplicationForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
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
      appliedAt: toYMDLocal(new Date()),
      notes: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    setServerError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create application");
      }
      const { id } = await res.json();
      router.push(`/applications/${id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" required error={errors.company?.message}>
          <input {...register("company")} placeholder="e.g. Stripe" className={inputCls(errors.company)} />
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          <input {...register("role")} placeholder="e.g. Senior Frontend Engineer" className={inputCls(errors.role)} />
        </Field>
      </div>

      <Field label="Job URL" error={errors.jobUrl?.message}>
        <input {...register("jobUrl")} placeholder="https://..." className={inputCls(errors.jobUrl)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" error={errors.type?.message}>
          <div className="flex gap-2">
            {LOCATION_TYPES.map((t) => (
              <label key={t} className="flex-1">
                <input type="radio" value={t} {...register("type")} className="peer sr-only" />
                <span className="block cursor-pointer rounded-lg border border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-700 transition-colors peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:bg-gray-50">
                  {LOCATION_LABELS[t]}
                </span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Location" error={errors.location?.message}>
          <input {...register("location")} placeholder="San Francisco, CA" className={inputCls(errors.location)} />
        </Field>
        <Field label="Salary" error={errors.salary?.message}>
          <input {...register("salary")} placeholder="$120k–$160k" className={inputCls(errors.salary)} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" error={errors.status?.message}>
          <select {...register("status")} className={inputCls(errors.status)}>
            {KANBAN_COLUMNS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Applied Date" error={errors.appliedAt?.message}>
          <input type="date" {...register("appliedAt")} className={inputCls(errors.appliedAt)} />
        </Field>
      </div>

      <Field label="Tech Stack" error={errors.stack?.message}>
        <Controller
          name="stack"
          control={control}
          render={({ field }) => (
            <StackTagInput value={field.value} onChange={field.onChange} error={errors.stack?.message} />
          )}
        />
      </Field>

      <Field label="Notes" error={errors.notes?.message} hint="Markdown supported">
        <textarea
          {...register("notes")}
          rows={5}
          placeholder="Interview notes, job description highlights, etc."
          className={`${inputCls(errors.notes)} resize-y font-mono text-sm`}
        />
      </Field>

      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isSubmitting ? "Saving..." : "Save Application"}
        </button>
      </div>
    </form>
  );
}

function inputCls(error?: { message?: string }) {
  return `w-full rounded-lg border bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors ${
    error ? "border-red-400 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-gray-900 focus:ring-gray-900"
  }`;
}

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500"> *</span>}
        {hint && <span className="ml-2 font-normal text-gray-400">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
