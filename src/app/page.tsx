
import { Metadata } from 'next';
import { LandingPageClient } from '@/components/landing-page-client';

// SEO Metadata for the landing page
export const metadata: Metadata = {
  title: 'ResumeBuddy | Free AI Resume Analyzer & ATS Score Checker',
  description: 'ResumeBuddy is your free AI-powered resume analyzer. Get instant ATS scores, personalized improvement suggestions, interview preparation questions, and skill gap analysis. Join thousands of students landing more interviews with ResumeBuddy.',
  keywords: [
    'ResumeBuddy',
    'resumebuddy',
    'resume buddy',
    'Resume Buddy',
    'free resume analyzer',
    'AI resume checker',
    'ATS score checker',
    'resume optimization',
    'interview preparation',
    'resume builder',
    'job search tools',
    'career development',
    'resume buddy ai',
    'best resume analyzer free',
  ],
  openGraph: {
    title: 'ResumeBuddy | #1 Free AI Resume Analyzer',
    description: 'ResumeBuddy helps you land more interviews. Get instant ATS scores, AI-powered analysis, and personalized improvements - completely free.',
    type: 'website',
    url: 'https://www.resume-buddy.tech',
    siteName: 'ResumeBuddy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeBuddy | Free AI Resume Analyzer',
    description: 'Transform your resume with ResumeBuddy AI. Get ATS scores & land more interviews!',
  },
  alternates: {
    canonical: 'https://www.resume-buddy.tech',
  },
};

// Static data for features - defined at build time for SEO
const features = [
  {
    icon: 'Brain',
    title: "AI-Powered Analysis",
    description: "Get detailed insights on how well your resume matches job requirements using advanced AI technology."
  },
  {
    icon: 'MessageSquare',
    title: "Interview Preparation",
    description: "Generate customized interview questions based on your resume and target job description."
  },
  {
    icon: 'Target',
    title: "Resume Optimization",
    description: "Receive actionable suggestions to improve your resume and increase your chances of getting hired."
  },
  {
    icon: 'FileText',
    title: "Q&A Generation",
    description: "Create comprehensive question-answer pairs to help you prepare for technical and behavioral interviews."
  },
  {
    icon: 'Zap',
    title: "Instant Results",
    description: "Get AI-powered insights in seconds, not hours. Upload, analyze, and optimize quickly."
  },
  {
    icon: 'Shield',
    title: "Secure & Private",
    description: "Your resume data is encrypted and stored securely. Your privacy is our top priority."
  }
];

const stats = [
  { value: "100+", label: "Resumes Analyzed" },
  { value: "95%", label: "Success Rate" },
  { value: "2.5x", label: "More Interviews" },
  { value: "24/7", label: "AI Availability" }
];

export default function LandingPage() {
  return (
    <main>
      <LandingPageClient features={features} stats={stats} />
    </main>
  );
}
