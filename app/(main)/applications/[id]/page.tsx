import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  DollarSign,
  Calendar,
  Mail,
  Linkedin,
  User,
} from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getApplicationById, getPrepsForStage } from "@/lib/applications";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  EVENT_LABELS,
  LOCATION_LABELS,
  type AppStatus,
  type EventType,
  type LocationType,
} from "@/types";
import { parseStack, getTagColor } from "@/lib/utils";
import StatusSelect from "@/components/applications/StatusSelect";
import AddEventForm from "@/components/applications/AddEventForm";
import AddContactForm from "@/components/applications/AddContactForm";
import DeleteButton from "@/components/applications/DeleteButton";
import FollowUpPicker from "@/components/applications/FollowUpPicker";
import ResumeFileUpload from "@/components/applications/ResumeFileUpload";
import SuggestJobs from "@/components/jobs/SuggestJobs";
import InterviewPrepCoach from "@/components/jobs/InterviewPrepCoach";
import MarkdownContent from "@/components/ui/MarkdownContent";

interface PageProps {
  params: { id: string };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const app = await getApplicationById(params.id, user.id);
  if (!app) notFound();

  const initialPreps = await getPrepsForStage(params.id, user.id, app.status);

  const stackTags = parseStack(app.stack);
  const locationType = LOCATION_LABELS[app.type as LocationType] ?? app.type;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-light text-t-muted transition-theme hover:text-t-primary sm:mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </Link>

      {/* Header card */}
      <div className="border border-edge bg-surface p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-[20px] font-medium text-t-primary sm:text-[24px]">{app.role}</h1>
            <p className="mt-0.5 text-[14px] font-light text-t-muted sm:mt-1 sm:text-[16px]">{app.company}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <StatusSelect applicationId={app.id} currentStatus={app.status as AppStatus} company={app.company} prepLinkOnStatusChange />
            <DeleteButton applicationId={app.id} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-light text-t-muted sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-[13px]">
          {app.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {app.location}
            </span>
          )}
          <span className="border border-edge bg-bg px-1.5 py-0.5 text-[10px] font-medium text-t-muted sm:px-2 sm:text-[11px]">
            {locationType}
          </span>
          {app.salary && (
            <span className="inline-flex items-center gap-1">
              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {app.salary}
            </span>
          )}
          {app.appliedAt && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {format(app.appliedAt, "MMM d, yyyy")}
            </span>
          )}
        </div>

        <div className="mt-2 sm:mt-3">
          <FollowUpPicker
            applicationId={app.id}
            currentDate={app.followUpDate ? app.followUpDate.toISOString().slice(0, 10) : null}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-start gap-x-6 gap-y-2 sm:mt-3">
          {app.resumeLabel && (
            <span className="inline-flex items-center gap-1.5 bg-[#1a1528] px-2 py-0.5 text-[10px] font-medium text-[#a78bfa] sm:px-2.5 sm:py-1 sm:text-[11px]">
              Resume: {app.resumeLabel}
            </span>
          )}
          <ResumeFileUpload applicationId={app.id} currentUrl={app.resumeFileUrl} />
        </div>

        {stackTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 sm:mt-4 sm:gap-1.5">
            {stackTags.map((tag) => (
              <span key={tag} className={`px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-[11px] ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {app.jobUrl && (
          <div className="mt-3 border-t border-edge pt-3 sm:mt-4 sm:pt-4">
            <a
              href={app.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent transition-theme hover:text-accent-hover sm:text-[13px]"
            >
              View posting <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Content grid — stacks on mobile */}
      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 sm:space-y-6">
          <section className="border border-edge bg-surface p-4 sm:p-6">
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-3">
              Notes
            </h2>
            {app.notes ? (
              <div className="prose-invert text-[13px]">
                <MarkdownContent content={app.notes} />
              </div>
            ) : (
              <p className="text-[12px] font-light text-t-faint sm:text-[13px]">No notes yet.</p>
            )}
          </section>

          <section className="border border-edge bg-surface p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Timeline
              </h2>
              <AddEventForm applicationId={app.id} />
            </div>
            {app.events.length === 0 ? (
              <p className="text-[12px] font-light text-t-faint sm:text-[13px]">No events logged yet.</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {app.events.map((event) => (
                  <div key={event.id} className="flex gap-2 sm:gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <div className="w-px flex-1 bg-edge" />
                    </div>
                    <div className="pb-3 sm:pb-4">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[12px] font-medium text-t-primary sm:text-[13px]">
                          {EVENT_LABELS[event.type as EventType] ?? event.type}
                        </span>
                        <span className="text-[10px] font-light text-t-faint sm:text-[11px]">
                          {format(event.scheduledAt, "MMM d, yyyy")}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="mt-0.5 text-[12px] font-light text-t-muted sm:mt-1 sm:text-[13px]">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <InterviewPrepCoach
            applicationId={app.id}
            company={app.company}
            role={app.role}
            currentStatus={app.status}
            initialPreps={initialPreps ?? undefined}
          />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <section className="border border-edge bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Contacts
              </h2>
              <AddContactForm applicationId={app.id} />
            </div>
            {app.contacts.length === 0 ? (
              <p className="text-[12px] font-light text-t-faint sm:text-[13px]">No contacts added.</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {app.contacts.map((c) => (
                  <div key={c.id} className="border border-edge bg-bg p-2.5 sm:p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-t-faint sm:h-3.5 sm:w-3.5" />
                      <span className="text-[12px] font-medium text-t-primary sm:text-[13px]">{c.name}</span>
                    </div>
                    {c.role && <p className="mt-0.5 pl-5 text-[10px] font-light text-t-muted sm:text-[11px]">{c.role}</p>}
                    <div className="mt-1 flex flex-wrap gap-2 pl-5 sm:mt-1.5 sm:gap-3">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-[10px] text-accent transition-theme hover:text-accent-hover sm:text-[11px]">
                          <Mail className="h-3 w-3" /> {c.email}
                        </a>
                      )}
                      {c.linkedin && (
                        <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-accent transition-theme hover:text-accent-hover sm:text-[11px]">
                          <Linkedin className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-edge bg-surface p-4 sm:p-5">
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-t-muted sm:mb-3">
              Info
            </h2>
            <dl className="space-y-1.5 text-[12px] sm:space-y-2 sm:text-[13px]">
              <div>
                <dt className="font-light text-t-faint">Created</dt>
                <dd className="font-medium text-t-muted">{format(app.createdAt, "MMM d, yyyy")}</dd>
              </div>
              <div>
                <dt className="font-light text-t-faint">Last updated</dt>
                <dd className="font-medium text-t-muted">{format(app.updatedAt, "MMM d, yyyy")}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <SuggestJobs applicationId={app.id} company={app.company} />
    </div>
  );
}
