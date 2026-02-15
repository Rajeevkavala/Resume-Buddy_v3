import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ResumeBuddy - Free AI Resume Analyzer & ATS Checker',
    short_name: 'ResumeBuddy',
    description: 'ResumeBuddy is the #1 free AI-powered resume analyzer. Get instant ATS scores, personalized improvements, and interview preparation. Land more interviews with ResumeBuddy.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2F68C8',
    orientation: 'portrait-primary',
    categories: ['productivity', 'business', 'utilities', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Go to your resume dashboard',
        url: '/dashboard',
      },
      {
        name: 'Create Resume',
        short_name: 'Create',
        description: 'Create a new resume',
        url: '/create-resume',
      },
    ],
  };
}
