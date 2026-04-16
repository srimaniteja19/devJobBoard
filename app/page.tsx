import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  CheckCircle2,
  FileSearch,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { getCurrentUser } from "@/lib/session";

const CORE_FEATURES = [
  "Track every application in one clean pipeline",
  "Keep interview timelines, contacts, and follow-ups in sync",
  "Match your resume against each job description",
  "Get prep help and job-search insights from built-in AI tools",
];

const PLAN_ROWS = [
  {
    name: "Free",
    price: "$0",
    items: [
      "Core application tracking",
      "Basic dashboard and calendar",
      "Limited AI checks each month",
    ],
  },
  {
    name: "Pro",
    price: "$7/mo",
    items: [
      "Unlimited AI coaching and resume matching",
      "Advanced analytics and blind-spot insights",
      "Daily email reports and export tools",
    ],
  },
];

const HERO_STATS = [
  { label: "Applications tracked", value: "50k+" },
  { label: "Interview workflows", value: "12k+" },
  { label: "Hours saved", value: "100k+" },
];

const HIGHLIGHTS = [
  {
    icon: Target,
    title: "Pipeline That Stays Clear",
    copy: "Move opportunities from wishlist to offer with one focused board view.",
  },
  {
    icon: FileSearch,
    title: "Resume Match in Seconds",
    copy: "Instantly see what each job description expects and what to fix.",
  },
  {
    icon: Brain,
    title: "AI Coach Built In",
    copy: "Get prep prompts, outreach drafts, and next-step suggestions per role.",
  },
  {
    icon: CalendarClock,
    title: "Follow-Ups Never Slip",
    copy: "Use reminders, schedule view, and calendar sync to stay on top of dates.",
  },
];

const WORKFLOW_STEPS = [
  "Save jobs and add applications quickly",
  "Track status, notes, contacts, and events",
  "Use AI to prep, tailor resume, and message recruiters",
  "Review stats weekly and focus on what works",
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-bg text-t-primary">
      <header className="border-b border-edge">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-medium">
            JobTracker
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="border border-edge px-3 py-1.5 text-[12px] font-light text-t-primary transition-theme hover:border-edge-hover"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 text-[12px] font-medium text-on-accent transition-theme hover:bg-accent-hover"
            >
              Get started
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-1.5 border border-edge bg-surface px-2.5 py-1 text-[11px] text-t-muted">
                <Sparkles className="h-3.5 w-3.5" />
                Job search OS for serious applicants
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-medium leading-tight sm:text-5xl">
                Land better roles with less chaos.
              </h1>
              <p className="mt-4 max-w-2xl text-[14px] font-light text-t-primary sm:text-[15px]">
                JobTracker helps you organize applications, prep faster, and make
                smarter decisions with analytics and AI assistance.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent transition-theme hover:bg-accent-hover"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="border border-edge px-4 py-2.5 text-[13px] font-light text-t-primary transition-theme hover:border-edge-hover"
                >
                  I already have an account
                </Link>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-2">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label} className="border border-edge bg-surface p-3">
                    <p className="text-lg font-medium sm:text-xl">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-light text-t-muted">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-edge bg-surface p-5">
              <p className="text-[11px] uppercase tracking-widest text-t-muted">
                This week in JobTracker
              </p>
              <div className="mt-4 space-y-3">
                <div className="border border-edge bg-bg p-3">
                  <p className="text-[12px] text-t-primary">Applications sent</p>
                  <p className="mt-1 text-xl font-medium">18</p>
                </div>
                <div className="border border-edge bg-bg p-3">
                  <p className="text-[12px] text-t-primary">Interview calls</p>
                  <p className="mt-1 text-xl font-medium">4</p>
                </div>
                <div className="border border-edge bg-bg p-3">
                  <p className="text-[12px] text-t-primary">Response rate trend</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xl font-medium">
                    +27%
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[12px] font-light text-t-primary">
                Visualize your progress, spot bottlenecks, and act on the right
                next move.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-edge bg-surface">
          <div className="container mx-auto grid max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2">
            {CORE_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-2 border border-edge bg-bg p-4"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" />
                <p className="text-[13px] font-light text-t-primary sm:text-[14px]">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="mb-6">
            <h2 className="text-2xl font-medium sm:text-3xl">
              Everything you need in one workflow
            </h2>
            <p className="mt-2 text-[13px] font-light text-t-primary sm:text-[14px]">
              No switching between docs, spreadsheets, and reminders.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="border border-edge bg-surface p-5">
                  <Icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-3 text-[16px] font-medium">{item.title}</h3>
                  <p className="mt-2 text-[13px] font-light text-t-primary">
                    {item.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-edge bg-surface">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-xl font-medium sm:text-2xl">How it works</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {WORKFLOW_STEPS.map((step, idx) => (
                <div key={step} className="flex items-start gap-3 border border-edge bg-bg p-4">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center border border-edge text-[11px] text-t-primary">
                    {idx + 1}
                  </span>
                  <p className="text-[13px] font-light text-t-primary">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="mb-6">
            <h2 className="text-2xl font-medium sm:text-3xl">
              Simple pricing, clear value
            </h2>
            <p className="mt-2 text-[13px] font-light text-t-primary sm:text-[14px]">
              Start free and upgrade when you want deeper AI and analytics.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {PLAN_ROWS.map((plan) => (
              <div key={plan.name} className="border border-edge bg-surface p-5">
                <p className="text-[12px] uppercase tracking-widest text-t-muted">
                  {plan.name}
                </p>
                <p className="mt-2 text-2xl font-medium">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px] font-light text-t-primary"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-edge bg-surface">
          <div className="container mx-auto max-w-6xl px-4 py-12 text-center">
            <h3 className="text-2xl font-medium sm:text-3xl">
              Ready to make your search feel lighter?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-[13px] font-light text-t-primary sm:text-[14px]">
              Set up your tracker in minutes and keep every application, follow-up,
              and prep task in one focused workspace.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent transition-theme hover:bg-accent-hover"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
