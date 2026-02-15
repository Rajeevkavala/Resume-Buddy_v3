import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Access Your Resume Dashboard',
  description: 'Sign in to ResumeBuddy to access your AI-powered resume analysis, ATS scores, interview preparation, and personalized improvement suggestions.',
  keywords: ['login', 'sign in', 'resume analyzer login', 'ResumeBuddy login'],
  openGraph: {
    title: 'Login to ResumeBuddy',
    description: 'Access your AI-powered resume analysis dashboard.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/login',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
