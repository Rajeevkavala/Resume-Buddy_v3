// JSON-LD Structured Data for SEO
// Place this in your layout or individual pages

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  potentialAction: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface SoftwareApplicationSchema {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    ratingCount: string;
  };
}

export interface FAQPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

// Default organization schema
export const organizationSchema: OrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ResumeBuddy',
  url: 'https://www.resume-buddy.tech',
  logo: 'https://www.resume-buddy.tech/icon.svg',
  description: 'ResumeBuddy is the leading free AI-powered resume analyzer and ATS score checker. Trusted by students and job seekers worldwide to land more interviews.',
  sameAs: [
    'https://www.resume-buddy.tech',
    // Add your social media URLs here when available
    // 'https://twitter.com/resumebuddy',
    // 'https://linkedin.com/company/resumebuddy',
    // 'https://github.com/resumebuddy',
  ],
};

// Website schema
export const websiteSchema: WebSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ResumeBuddy',
  url: 'https://www.resume-buddy.tech',
  description: 'ResumeBuddy is the #1 free AI-powered resume analyzer. Get instant ATS scores, personalized improvements, and interview preparation to land your dream job.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.resume-buddy.tech/dashboard?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

// Software application schema
export const softwareAppSchema: SoftwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ResumeBuddy',
  description: 'ResumeBuddy is a free AI-powered resume analyzer that provides instant ATS scores, personalized improvement suggestions, interview preparation questions, and skill gap analysis. Trusted by students and job seekers to land more interviews.',
  url: 'https://www.resume-buddy.tech',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '50',
  },
};

// FAQ schema for common questions
export const faqSchema: FAQPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is ResumeBuddy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ResumeBuddy is the #1 free AI-powered resume analyzer that helps students and job seekers optimize their resumes for Applicant Tracking Systems (ATS). ResumeBuddy provides instant ATS scores, personalized improvement suggestions, interview preparation questions, and skill gap analysis - all completely free at resume-buddy.tech.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does ResumeBuddy ATS score checker work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ResumeBuddy uses advanced AI to analyze your resume against the job description you provide. It checks for keyword matches, formatting compatibility, and content relevance, then provides a comprehensive ATS score and specific recommendations to improve your chances of passing automated screening systems.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ResumeBuddy free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! ResumeBuddy is completely free to use. You get access to AI-powered resume analysis, ATS scoring, improvement suggestions, and interview question generation at no cost. Simply visit resume-buddy.tech and sign up to get started.',
      },
    },
    {
      '@type': 'Question',
      name: 'How can ResumeBuddy help me land more interviews?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ResumeBuddy helps you optimize your resume for specific job descriptions, ensuring your skills and experience are highlighted effectively. The AI provides actionable suggestions to improve keyword matching, formatting, and content structure, which helps you pass ATS screenings and catch recruiters\' attention. Students using ResumeBuddy report getting 2.5x more interview callbacks.',
      },
    },
    {
      '@type': 'Question',
      name: 'What file formats does ResumeBuddy support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ResumeBuddy supports PDF and DOCX file formats for resume uploads. These are the most commonly used formats by job seekers and are fully compatible with Applicant Tracking Systems. You can also export your optimized resume as a professional PDF with LaTeX formatting.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where can I access ResumeBuddy?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can access ResumeBuddy for free at https://www.resume-buddy.tech. The platform works on any modern web browser and is available 24/7. No download required - just visit the website and start analyzing your resume.',
      },
    },
  ],
};

// Helper function to generate JSON-LD script tag
export function generateJsonLd(schema: object): string {
  return JSON.stringify(schema);
}

// Breadcrumb schema generator
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Product schema for ResumeBuddy
export const productSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'ResumeBuddy',
  description: 'Free AI-powered resume analyzer and ATS score checker',
  brand: {
    '@type': 'Brand',
    name: 'ResumeBuddy',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://www.resume-buddy.tech',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    bestRating: '5',
    worstRating: '1',
    ratingCount: '50',
  },
};

// Service schema
export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'ResumeBuddy AI Resume Analysis',
  serviceType: 'Resume Analysis',
  provider: {
    '@type': 'Organization',
    name: 'ResumeBuddy',
    url: 'https://www.resume-buddy.tech',
  },
  description: 'Free AI-powered resume analysis service that provides ATS scoring, improvement suggestions, and interview preparation.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  areaServed: {
    '@type': 'Place',
    name: 'Worldwide',
  },
};

// Combined schemas for homepage
export const homePageSchemas = [
  organizationSchema,
  websiteSchema,
  softwareAppSchema,
  faqSchema,
  productSchema,
  serviceSchema,
];

// Educational/How-To schema for landing page
export const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Analyze Your Resume with ResumeBuddy',
  description: 'Learn how to use ResumeBuddy to analyze and optimize your resume for ATS systems and land more interviews.',
  step: [
    {
      '@type': 'HowToStep',
      name: 'Upload Your Resume',
      text: 'Upload your resume in PDF or DOCX format. ResumeBuddy AI will instantly extract and analyze the content.',
      position: 1,
    },
    {
      '@type': 'HowToStep',
      name: 'Add Job Description',
      text: 'Paste the job description you are targeting. ResumeBuddy will compare it with your resume for perfect matching.',
      position: 2,
    },
    {
      '@type': 'HowToStep',
      name: 'Get AI Insights',
      text: 'Receive detailed ATS score, interview questions, and optimization suggestions to land your dream job.',
      position: 3,
    },
  ],
  totalTime: 'PT5M',
  tool: {
    '@type': 'HowToTool',
    name: 'ResumeBuddy',
  },
};
