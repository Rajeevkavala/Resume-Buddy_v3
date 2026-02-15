import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Analysis - AI-Powered ATS Score & Insights',
  description: 'Get detailed AI analysis of your resume including ATS compatibility score, keyword optimization, skill gap analysis, and personalized improvement recommendations.',
  keywords: ['resume analysis', 'ATS score', 'resume checker', 'keyword optimization', 'skill gap analysis'],
  openGraph: {
    title: 'AI Resume Analysis - Check Your ATS Score',
    description: 'Get instant AI-powered analysis of your resume with ATS scoring and improvement suggestions.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/analysis',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/analysis',
  },
};

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
