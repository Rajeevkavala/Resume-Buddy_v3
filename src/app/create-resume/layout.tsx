import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Resume - AI-Powered Resume Builder',
  description: 'Build a professional, ATS-optimized resume with ResumeBuddy AI resume builder. Choose from modern templates and get AI suggestions for better content.',
  keywords: ['resume builder', 'create resume', 'AI resume builder', 'professional resume templates', 'ATS-friendly resume'],
  openGraph: {
    title: 'Create Your Professional Resume with AI',
    description: 'Build an ATS-optimized resume with our AI-powered resume builder and modern templates.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/create-resume',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/create-resume',
  },
};

export default function CreateResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
