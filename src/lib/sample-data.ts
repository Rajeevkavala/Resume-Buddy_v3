import { ResumeData } from '@/lib/types';

export const SAMPLE_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexjohnson',
    github: 'github.com/alexjohnson',
    portfolio: 'alexjohnson.dev',
    website: 'https://alexjohnson.dev'
  },
  summary: 'Innovative Full-Stack Developer with 5+ years of experience building scalable web applications. Passionate about creating exceptional user experiences and optimizing system performance. Proven track record of leading cross-functional teams and delivering high-impact projects.',
  skills: [
    {
      category: 'Programming Languages',
      items: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go']
    },
    {
      category: 'Frontend Technologies',
      items: ['React', 'Next.js', 'Vue.js', 'HTML5', 'CSS3', 'Tailwind CSS']
    },
    {
      category: 'Backend Technologies',
      items: ['Node.js', 'Express.js', 'Django', 'PostgreSQL', 'MongoDB', 'Redis']
    },
    {
      category: 'Cloud & DevOps',
      items: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'GitHub Actions']
    }
  ],
  experience: [
    {
      title: 'Senior Full-Stack Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      startDate: 'Jan 2022',
      endDate: '',
      current: true,
      achievements: [
        'Led development of a microservices architecture that improved system scalability by 300%',
        'Mentored 3 junior developers and established coding standards that reduced bug reports by 40%',
        'Implemented automated testing pipeline that decreased deployment time from 2 hours to 15 minutes',
        'Architected and built a real-time analytics dashboard serving 50k+ daily active users'
      ]
    },
    {
      title: 'Full-Stack Developer',
      company: 'StartupXYZ',
      location: 'Remote',
      startDate: 'Mar 2020',
      endDate: 'Dec 2021',
      current: false,
      achievements: [
        'Developed responsive web applications using React and Node.js for 100k+ users',
        'Optimized database queries resulting in 60% faster page load times',
        'Collaborated with design team to implement pixel-perfect UI components',
        'Built RESTful APIs handling 1M+ requests per day with 99.9% uptime'
      ]
    },
    {
      title: 'Frontend Developer',
      company: 'Digital Agency Co.',
      location: 'New York, NY',
      startDate: 'Jun 2019',
      endDate: 'Feb 2020',
      current: false,
      achievements: [
        'Created responsive websites for 15+ clients using modern JavaScript frameworks',
        'Improved website performance scores by average of 35% through optimization techniques',
        'Implemented accessibility standards achieving WCAG 2.1 AA compliance'
      ]
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of California, Berkeley',
      location: 'Berkeley, CA',
      graduationDate: 'May 2019',
      gpa: '3.8/4.0',
      honors: ['Summa Cum Laude', "Dean's List"]
    }
  ],
  projects: [
    {
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with advanced features including real-time inventory management, payment processing, and analytics dashboard.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Stripe API', 'AWS'],
      link: 'https://github.com/alexjohnson/ecommerce-platform',
      achievements: [
        'Handles 10k+ concurrent users with sub-second response times',
        'Processes $500k+ in monthly transactions',
        'Features advanced search with Elasticsearch integration'
      ]
    },
    {
      name: 'Task Management App',
      description: 'Collaborative project management tool with real-time updates, team collaboration features, and advanced reporting capabilities.',
      technologies: ['Next.js', 'TypeScript', 'Prisma', 'Socket.io', 'Tailwind CSS'],
      link: 'https://taskmaster-pro.com',
      achievements: [
        'Real-time collaboration for teams up to 50 members',
        'Advanced analytics and reporting dashboard',
        'Mobile-responsive design with PWA capabilities'
      ]
    },
    {
      name: 'AI-Powered Content Generator',
      description: 'Machine learning application that generates high-quality content using natural language processing and GPT integration.',
      technologies: ['Python', 'FastAPI', 'OpenAI API', 'React', 'Docker'],
      link: 'https://github.com/alexjohnson/ai-content-gen',
      achievements: [
        'Generates 1000+ unique articles per day',
        'Achieved 92% user satisfaction rating',
        'Deployed using containerized microservices architecture'
      ]
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: 'Mar 2023',
      expirationDate: 'Mar 2026',
      credentialId: 'AWS-SAA-123456'
    },
    {
      name: 'Google Cloud Professional Developer',
      issuer: 'Google Cloud',
      date: 'Jan 2023',
      expirationDate: 'Jan 2025',
      credentialId: 'GCP-PD-789012'
    },
    {
      name: 'Certified Kubernetes Administrator',
      issuer: 'Cloud Native Computing Foundation',
      date: 'Nov 2022',
      expirationDate: 'Nov 2025',
      credentialId: 'CKA-345678'
    }
  ],
  awards: [
    {
      title: 'Employee of the Year',
      issuer: 'TechCorp Inc.',
      date: '2023',
      description: 'Recognized for outstanding technical leadership and innovation'
    },
    {
      title: 'Best Mobile App',
      issuer: 'SF Tech Awards',
      date: '2022',
      description: 'Task Management App won Best Mobile Application'
    }
  ],
  languages: [
    {
      language: 'English',
      proficiency: 'Native'
    },
    {
      language: 'Spanish',
      proficiency: 'Professional'
    },
    {
      language: 'Mandarin',
      proficiency: 'Intermediate'
    }
  ],
  interests: [
    'Open Source Contributing',
    'Machine Learning',
    'Rock Climbing',
    'Photography',
    'Cooking',
    'Traveling'
  ]
};

export const MINIMAL_SAMPLE_DATA: ResumeData = {
  personalInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    github: 'github.com/johndoe'
  },
  summary: 'Passionate software developer with experience in modern web technologies and a strong foundation in computer science principles.',
  skills: [
    {
      category: 'Programming',
      items: ['JavaScript', 'Python', 'React', 'Node.js']
    },
    {
      category: 'Tools',
      items: ['Git', 'Docker', 'AWS', 'MongoDB']
    }
  ],
  experience: [
    {
      title: 'Software Developer',
      company: 'Tech Company',
      location: 'New York, NY',
      startDate: 'Jan 2023',
      endDate: '',
      current: true,
      achievements: [
        'Developed responsive web applications using React',
        'Collaborated with cross-functional teams to deliver features',
        'Optimized application performance and user experience'
      ]
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      location: 'New York, NY',
      graduationDate: 'May 2022',
      gpa: '3.7/4.0'
    }
  ],
  projects: [
    {
      name: 'Personal Portfolio',
      description: 'A responsive portfolio website showcasing my projects and skills.',
      technologies: ['React', 'CSS3', 'JavaScript'],
      link: 'https://johndoe.dev',
      achievements: [
        'Fully responsive design',
        'Optimized for performance',
        'Modern UI/UX design'
      ]
    }
  ]
};

// Different sample data for different industries
export const SAMPLE_DATA_BY_INDUSTRY = {
  Tech: SAMPLE_RESUME_DATA,
  Creative: {
    ...SAMPLE_RESUME_DATA,
    personalInfo: {
      ...SAMPLE_RESUME_DATA.personalInfo,
      fullName: 'Sarah Designer',
      portfolio: 'sarahdesigner.com'
    },
    summary: 'Creative UI/UX Designer with 4+ years of experience crafting beautiful, user-centered digital experiences. Passionate about solving complex design challenges and creating intuitive interfaces that delight users.',
    skills: [
      {
        category: 'Design Tools',
        items: ['Figma', 'Adobe Creative Suite', 'Sketch', 'InVision', 'Principle']
      },
      {
        category: 'Design Skills',
        items: ['UI/UX Design', 'Prototyping', 'User Research', 'Information Architecture']
      },
      {
        category: 'Frontend',
        items: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS']
      }
    ]
  },
  Corporate: {
    ...SAMPLE_RESUME_DATA,
    personalInfo: {
      ...SAMPLE_RESUME_DATA.personalInfo,
      fullName: 'Michael Executive',
      portfolio: undefined
    },
    summary: 'Results-driven Executive with 10+ years of experience leading cross-functional teams and driving business growth. Proven track record of increasing revenue by 150% and managing budgets exceeding $50M.',
    skills: [
      {
        category: 'Leadership',
        items: ['Team Management', 'Strategic Planning', 'Budget Management', 'Stakeholder Relations']
      },
      {
        category: 'Business',
        items: ['P&L Management', 'Market Analysis', 'Business Development', 'Process Optimization']
      }
    ]
  }
};

// Export utility function to get sample data by industry
export function getSampleDataByIndustry(industry: string): ResumeData {
  return SAMPLE_DATA_BY_INDUSTRY[industry as keyof typeof SAMPLE_DATA_BY_INDUSTRY] || SAMPLE_RESUME_DATA;
}