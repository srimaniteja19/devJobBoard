import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { getCurrentUser } from "@/lib/session";

const FEATURE_ROWS = [
  {
    label: "Application tracking",
    free: "Up to 75 applications",
    premium: "Unlimited applications",
  },
  {
    label: "AI job coach messages",
    free: "20 per month",
    premium: "Unlimited",
  },
  {
    label: "Resume match checks",
    free: "3 per month",
    premium: "Unlimited + deeper suggestions",
  },
  {
    label: "Job sources",
    free: "Up to 3 sources",
    premium: "Unlimited sources",
  },
  {
    label: "Advanced analytics",
    free: false,
    premium: true,
  },
  {
    label: "Blind-spot detector",
    free: false,
    premium: true,
  },
  {
    label: "Daily reports + exports",
    free: false,
    premium: true,
  },
  {
    label: "Calendar ICS sync",
    free: false,
    premium: true,
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-accent" aria-label="Included" />;
  }
  if (value === false) {
    return <X className="h-4 w-4 text-t-muted" aria-label="Not included" />;
  }
  return <span className="text-[13px] font-light text-t-primary">{value}</span>;
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  const premiumHref = user ? "/dashboard" : "/signup";
  const premiumLabel = user ? "Upgrade to Premium" : "Start Premium";

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
              href={user ? "/dashboard" : "/login"}
              className="border border-edge px-3 py-1.5 text-[12px] font-light text-t-primary transition-theme hover:border-edge-hover"
            >
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] uppercase tracking-widest text-t-muted">Pricing</p>
          <h1 className="mt-3 text-3xl font-medium sm:text-5xl">
            Simple plans for every stage of your job search
          </h1>
          <p className="mt-4 text-[14px] font-light text-t-primary sm:text-[15px]">
            Start free. Upgrade to Premium for unlimited AI workflows, deeper
            analytics, and faster execution.
          </p>
        </div>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <article className="border border-edge bg-surface p-6">
            <p className="text-[12px] uppercase tracking-widest text-t-muted">Free</p>
            <p className="mt-2 text-4xl font-medium">$0</p>
            <p className="mt-1 text-[13px] font-light text-t-muted">Great for getting started</p>
            <ul className="mt-5 space-y-2">
              <li className="flex items-start gap-2 text-[13px] font-light text-t-primary">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                Track applications, statuses, contacts, and events
              </li>
              <li className="flex items-start gap-2 text-[13px] font-light text-t-primary">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                Basic board, calendar, and schedule views
              </li>
              <li className="flex items-start gap-2 text-[13px] font-light text-t-primary">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                Limited AI and resume matching every month
              </li>
            </ul>
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="mt-6 inline-flex border border-edge px-4 py-2.5 text-[13px] font-light text-t-primary transition-theme hover:border-edge-hover"
            >
              {user ? "Continue on Free" : "Create Free Account"}
            </Link>
          </article>

          <article className="relative border border-accent bg-surface p-6 shadow-[0_0_0_1px_var(--color-accent)]">
            <span className="absolute right-4 top-4 border border-accent bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-on-accent">
              Popular
            </span>
            <p className="text-[12px] uppercase tracking-widest text-t-muted">Premium</p>
            <p className="mt-2 text-4xl font-medium">
              $7<span className="text-lg font-light text-t-muted">/month</span>
            </p>
            <p className="mt-1 text-[13px] font-light text-t-muted">
              Built for serious, high-volume job hunts
            </p>
            <ul className="mt-5 space-y-2">
              <li className="flex items-start gap-2 text-[13px] font-light text-t-primary">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                Unlimited AI job coach and resume matching
              </li>
              <li className="flex items-start gap-2 text-[13px] font-light text-t-primary">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                Advanced analytics and blind-spot insights
              </li>
              <li className="flex items-start gap-2 text-[13px] font-light text-t-primary">
                <Check className="mt-0.5 h-4 w-4 text-accent" />
                Daily reports, exports, and premium automation
              </li>
            </ul>
            <Link
              href={premiumHref}
              className="mt-6 inline-flex items-center gap-2 bg-accent px-4 py-2.5 text-[13px] font-medium text-on-accent transition-theme hover:bg-accent-hover"
            >
              {premiumLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </section>

        <section className="mt-10 border border-edge bg-surface">
          <div className="border-b border-edge px-4 py-3 sm:px-6">
            <h2 className="text-lg font-medium sm:text-xl">Feature comparison</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-edge bg-bg">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-t-muted sm:px-6">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-t-muted sm:px-6">
                    Free
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-widest text-t-muted sm:px-6">
                    Premium ($7/mo)
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-edge last:border-b-0">
                    <td className="px-4 py-3 text-[13px] font-light text-t-primary sm:px-6">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <CellValue value={row.free} />
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <CellValue value={row.premium} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
