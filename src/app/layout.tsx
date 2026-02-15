
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Poppins, Montserrat, Work_Sans, Playfair_Display, JetBrains_Mono, Manrope, Archivo } from 'next/font/google';
import './globals.css';
import './template-fonts.css';
import './print-resume.css';
import './enhanced-template-styles.css';
import ClientLayout from './client-layout';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { organizationSchema, websiteSchema, softwareAppSchema, faqSchema, productSchema, serviceSchema, howToSchema } from '@/lib/seo-schemas';

// Optimize font loading with next/font
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Modern typography fonts for landing page upgrade
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
  preload: true,
  fallback: ['Inter', 'system-ui', 'sans-serif'],
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
  fallback: ['Space Grotesk', 'system-ui', 'sans-serif'],
});

// Resume Template Fonts
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-work-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ResumeBuddy | Free AI Resume Analyzer & ATS Score Checker',
    template: '%s | ResumeBuddy'
  },
  description: 'ResumeBuddy is the #1 free AI-powered resume analyzer. Get instant ATS scores, personalized improvement suggestions, interview preparation questions, and land more interviews. Trusted by students and job seekers worldwide.',
  keywords: [
    'ResumeBuddy',
    'resumebuddy',
    'resume buddy',
    'Resume Buddy',
    'resume-buddy',
    'AI resume analyzer',
    'free resume analyzer',
    'ATS score checker',
    'ATS resume scanner',
    'resume checker online',
    'AI resume checker',
    'resume optimization tool',
    'interview preparation',
    'resume builder free',
    'job application helper',
    'career tools',
    'resume score checker',
    'best resume analyzer',
    'resume tips',
    'professional resume help',
    'resume templates',
    'interview questions generator',
    'skill gap analysis',
    'resume buddy ai',
    'resume buddy tool'
  ],
  authors: [{ name: 'ResumeBuddy Team' }],
  creator: 'ResumeBuddy',
  publisher: 'ResumeBuddy',
  applicationName: 'ResumeBuddy',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
  metadataBase: new URL('https://www.resume-buddy.tech'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    title: 'ResumeBuddy | #1 Free AI Resume Analyzer & ATS Checker',
    description: 'ResumeBuddy helps you land more interviews with AI-powered resume analysis. Get instant ATS scores, personalized improvements, and interview prep - completely free.',
    type: 'website',
    url: 'https://www.resume-buddy.tech',
    siteName: 'ResumeBuddy',
    locale: 'en_US',
    images: [
      {
        url: 'https://www.resume-buddy.tech/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ResumeBuddy - Free AI Resume Analyzer and ATS Score Checker',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeBuddy | Free AI Resume Analyzer',
    description: 'Transform your resume with ResumeBuddy. Get instant ATS scores, interview prep & personalized improvements - free!',
    images: ['https://www.resume-buddy.tech/og-image.png'],
    creator: '@resumebuddy',
    site: '@resumebuddy',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    // Add your verification codes here when you have them
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'technology',
  classification: 'Resume Tools, Career Development, AI Tools',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${manrope.variable} ${archivo.variable} ${poppins.variable} ${montserrat.variable} ${workSans.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareAppSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(howToSchema),
          }}
        />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ClientLayout>
          {children}
          <Analytics />
          <SpeedInsights />
        </ClientLayout>
      </body>
    </html>
  );
}
