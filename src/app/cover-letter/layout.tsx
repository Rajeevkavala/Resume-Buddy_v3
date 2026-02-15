import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cover Letter Generator - AI-Powered Professional Letters',
  description: 'Generate personalized, professional cover letters instantly using AI. Tailored to your resume and job description for maximum impact.',
  keywords: ['cover letter generator', 'AI cover letter', 'job application', 'professional cover letter', 'personalized cover letter'],
  openGraph: {
    title: 'AI Cover Letter Generator - Create Professional Letters Instantly',
    description: 'Generate compelling, personalized cover letters that stand out. Tailored to your resume and target job.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/cover-letter',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/cover-letter',
  },
};

export default function CoverLetterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
