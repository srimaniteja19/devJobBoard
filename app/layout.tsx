import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Application Tracker",
  description: "Track your job applications through the hiring pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-t-primary">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
