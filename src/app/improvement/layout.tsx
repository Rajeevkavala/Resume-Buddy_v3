import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume Improvements - AI Optimization Suggestions',
  description: 'Get AI-powered suggestions to improve your resume content, formatting, and keyword optimization for better ATS compatibility and recruiter appeal.',
  keywords: ['resume improvement', 'resume optimization', 'resume suggestions', 'improve resume', 'ATS optimization'],
  openGraph: {
    title: 'AI Resume Improvements - Optimize Your Resume',
    description: 'Get personalized suggestions to improve your resume and increase your interview chances.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/improvement',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/improvement',
  },
};

export default function ImprovementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
