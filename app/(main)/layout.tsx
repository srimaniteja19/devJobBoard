"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "@/components/layout/AuthButton";
import AddButton from "@/components/applications/AddButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Board" },
  { href: "/applications", label: "Table" },
  { href: "/stats", label: "Stats" },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg">
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
                      isActive
                        ? "text-t-primary"
                        : "text-t-muted hover:text-t-primary"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-accent" />
                    )}
                  </Link>
                );
              })}
              <AddButton variant="nav" />
            </div>
          </div>
          <AuthButton />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
