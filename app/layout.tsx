import type { Metadata, Viewport } from "next";
import Script from "next/script";
import SessionProvider from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import SearchProvider from "@/components/providers/SearchProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import CommandPalette from "@/components/search/CommandPalette";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "Track your job applications through the hiring pipeline",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

/** Inline script to prevent theme flash — runs before paint */
const themeScript = `
(function() {
  const stored = localStorage.getItem('jobtracker-theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-t-primary">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>
              <SearchProvider>
                {children}
                <CommandPalette />
              </SearchProvider>
            </ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
