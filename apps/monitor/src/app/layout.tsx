import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/layout/query-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata: Metadata = {
  title: "Resume Buddy Monitor v2 | Enterprise Observability",
  description:
    "Mission Control observability platform for Resume Buddy — Real-time telemetry, CloudWatch, Vercel edge, and incident management.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#030712] text-slate-300 antialiased overflow-hidden">
        <AppProviders>
          <DashboardShell>{children}</DashboardShell>
        </AppProviders>
      </body>
    </html>
  );
}
