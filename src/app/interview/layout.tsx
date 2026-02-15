import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interview Preparation - AI-Generated Questions',
  description: 'Prepare for your job interview with AI-generated questions based on your resume and job description. Get personalized interview tips and practice answers.',
  keywords: ['interview preparation', 'interview questions', 'job interview tips', 'AI interview prep', 'behavioral questions'],
  openGraph: {
    title: 'AI Interview Preparation - Get Ready for Your Job Interview',
    description: 'Practice with AI-generated interview questions tailored to your resume and target job.',
    type: 'website',
    url: 'https://www.resume-buddy.tech/interview',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/interview',
  },
};

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
