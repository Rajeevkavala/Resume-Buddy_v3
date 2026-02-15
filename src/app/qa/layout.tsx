import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Q&A Generator - Interview Question Answers',
  description: 'Generate comprehensive question-answer pairs based on your resume to help you prepare for technical and behavioral interview questions.',
  keywords: ['interview Q&A', 'question answers', 'interview preparation', 'behavioral questions', 'technical interview'],
  openGraph: {
    title: 'Interview Q&A Generator - Prepare Your Answers',
    description: 'Generate and practice answers to common interview questions based on your experience.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/qa',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/qa',
  },
};

export default function QALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
