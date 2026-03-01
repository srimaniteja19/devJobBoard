import type { Metadata, Viewport } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import SearchProvider from "@/components/providers/SearchProvider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-t-primary">
        <SessionProvider>
          <ToastProvider>
            <SearchProvider>
              {children}
              <CommandPalette />
            </SearchProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
