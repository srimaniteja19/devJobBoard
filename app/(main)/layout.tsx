"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Table2, BarChart3, Activity, Calendar } from "lucide-react";
import AuthButton from "@/components/layout/AuthButton";
import AddButton from "@/components/applications/AddButton";
import { useSearch } from "@/components/providers/SearchProvider";

/** Refreshes server data when user switches back to this tab (e.g. after adding a job via extension). */
function RefreshOnTabFocus() {
  const router = useRouter();
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [router]);
  return null;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Board", icon: LayoutDashboard },
  { href: "/applications", label: "Table", icon: Table2 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/activity", label: "Activity", icon: Activity },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { setOpen } = useSearch();

  return (
    <div className="min-h-screen bg-bg pb-16 sm:pb-0">
      <RefreshOnTabFocus />
      {/* Desktop top nav */}
      <header className="sticky top-0 z-40 border-b border-edge bg-bg">
        <nav className="container mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-t-primary">
              JobTracker
            </Link>
            <div className="hidden items-center gap-1 sm:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-2.5 py-1.5 text-[13px] font-light transition-theme ${
                      isActive ? "text-t-primary" : "text-t-muted hover:text-t-primary"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-accent" />
                    )}
                  </Link>
                );
              })}
              <Suspense fallback={<span className="px-2.5 py-1.5 text-[13px] text-t-muted">Add</span>}>
                <AddButton variant="nav" />
              </Suspense>
              <button
                onClick={() => setOpen(true)}
                className="ml-1 flex items-center gap-1 border border-edge px-2 py-1 text-[10px] text-t-faint transition-theme hover:border-edge-hover hover:text-t-muted"
              >
                <span>⌘K</span>
              </button>
            </div>
          </div>
          <AuthButton />
        </nav>
      </header>

      <main>{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-edge bg-bg sm:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-light transition-theme ${
                isActive ? "text-accent" : "text-t-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="flex flex-1 flex-col items-center gap-0.5 py-2.5">
          <Suspense fallback={<span className="text-[10px] text-t-muted">Add</span>}>
            <AddButton variant="mobile" />
          </Suspense>
        </div>
      </nav>
    </div>
  );
}
