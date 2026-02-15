import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Profile - Account Settings',
  description: 'Manage your ResumeBuddy account settings, profile information, and preferences.',
  robots: {
    index: false, // Profile pages shouldn't be indexed
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
