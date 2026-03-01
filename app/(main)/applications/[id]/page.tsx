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
import { getApplicationById } from "@/lib/applications";
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
import MarkdownContent from "@/components/ui/MarkdownContent";

interface PageProps {
  params: { id: string };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const app = await getApplicationById(params.id, user.id);
  if (!app) notFound();

  const stackTags = parseStack(app.stack);
  const locationType = LOCATION_LABELS[app.type as LocationType] ?? app.type;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-light text-t-muted transition-theme hover:text-t-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to board
      </Link>

      <div className="border border-edge bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-medium text-t-primary">{app.role}</h1>
            <p className="mt-1 text-[16px] font-light text-t-muted">{app.company}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusSelect applicationId={app.id} currentStatus={app.status as AppStatus} />
            <DeleteButton applicationId={app.id} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-light text-t-muted">
          {app.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {app.location}
            </span>
          )}
          <span className="border border-edge bg-bg px-2 py-0.5 text-[11px] font-medium text-t-muted">
            {locationType}
          </span>
          {app.salary && (
            <span className="inline-flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> {app.salary}
            </span>
          )}
          {app.appliedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Applied {format(app.appliedAt, "MMM d, yyyy")}
            </span>
          )}
        </div>

        {app.resumeLabel && (
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 bg-[#1a1528] px-2.5 py-1 text-[11px] font-medium text-[#a78bfa]">
              Resume: {app.resumeLabel}
            </span>
          </div>
        )}

        {stackTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {stackTags.map((tag) => (
              <span key={tag} className={`px-2.5 py-1 text-[11px] font-medium ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {app.jobUrl && (
          <div className="mt-4 border-t border-edge pt-4">
            <a
              href={app.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-theme hover:text-accent-hover"
            >
              View job posting <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <section className="border border-edge bg-surface p-6">
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted">
              Notes
            </h2>
            {app.notes ? (
              <div className="prose-invert">
                <MarkdownContent content={app.notes} />
              </div>
            ) : (
              <p className="text-[13px] font-light text-t-faint">No notes yet.</p>
            )}
          </section>

          <section className="border border-edge bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Timeline
              </h2>
              <AddEventForm applicationId={app.id} />
            </div>
            {app.events.length === 0 ? (
              <p className="text-[13px] font-light text-t-faint">No events logged yet.</p>
            ) : (
              <div className="space-y-4">
                {app.events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <div className="w-px flex-1 bg-edge" />
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-t-primary">
                          {EVENT_LABELS[event.type as EventType] ?? event.type}
                        </span>
                        <span className="text-[11px] font-light text-t-faint">
                          {format(event.scheduledAt, "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="mt-1 text-[13px] font-light text-t-muted">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-edge bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[11px] font-medium uppercase tracking-widest text-t-muted">
                Contacts
              </h2>
              <AddContactForm applicationId={app.id} />
            </div>
            {app.contacts.length === 0 ? (
              <p className="text-[13px] font-light text-t-faint">No contacts added.</p>
            ) : (
              <div className="space-y-3">
                {app.contacts.map((c) => (
                  <div key={c.id} className="border border-edge bg-bg p-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-t-faint" />
                      <span className="text-[13px] font-medium text-t-primary">{c.name}</span>
                    </div>
                    {c.role && <p className="mt-0.5 pl-5 text-[11px] font-light text-t-muted">{c.role}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-3 pl-5">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-[11px] text-accent transition-theme hover:text-accent-hover">
                          <Mail className="h-3 w-3" /> {c.email}
                        </a>
                      )}
                      {c.linkedin && (
                        <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-accent transition-theme hover:text-accent-hover">
                          <Linkedin className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border border-edge bg-surface p-5">
            <h2 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-t-muted">
              Info
            </h2>
            <dl className="space-y-2 text-[13px]">
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
    </div>
  );
}
