import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Your Resume Command Center',
  description: 'Manage your resumes, track analysis history, and access AI-powered tools for resume optimization, interview preparation, and career development.',
  keywords: ['resume dashboard', 'resume management', 'job search tools', 'career dashboard'],
  openGraph: {
    title: 'Your ResumeBuddy Dashboard',
    description: 'Access all your resume tools, analysis history, and career insights in one place.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/dashboard',
  },
  robots: {
    index: false, // Dashboard is user-specific, shouldn't be indexed
    follow: true,
  },
  alternates: {
    canonical: '/dashboard',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
