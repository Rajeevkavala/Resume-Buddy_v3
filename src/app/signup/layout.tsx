import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Create Your Free Account',
  description: 'Create a free ResumeBuddy account to get AI-powered resume analysis, ATS score checking, interview preparation questions, and personalized career guidance.',
  keywords: ['sign up', 'register', 'create account', 'free resume analyzer', 'ResumeBuddy signup'],
  openGraph: {
    title: 'Sign Up for ResumeBuddy - Free AI Resume Analyzer',
    description: 'Create your free account and start optimizing your resume with AI.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/signup',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/signup',
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
