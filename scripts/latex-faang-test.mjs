/**
 * FAANG Template Test with resumeData source.
 * 
 * Usage:
 *   LATEX_SERVICE_URL=http://localhost:8080 node scripts/latex-faang-test.mjs
 */

const serviceUrl = process.env.LATEX_SERVICE_URL || 'http://localhost:8080';
const endpoint = serviceUrl.replace(/\/+$/, '') + '/v1/resume/latex/compile';

const resumeData = {
  personalInfo: {
    fullName: 'RAJEEV KAVALA',
    email: 'rajeev.kavala@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/rajeevkavala',
    github: 'github.com/rajeevkavala',
  },
  summary: 'Full-stack developer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies.',
  skills: {
    languages: ['Python', 'JavaScript', 'TypeScript', 'Java', 'SQL'],
    frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'FastAPI'],
    tools: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Git'],
    databases: ['PostgreSQL', 'MongoDB', 'Redis', 'DynamoDB'],
  },
  experience: [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      startDate: 'Jan 2022',
      endDate: null,
      current: true,
      location: 'San Francisco, CA',
      achievements: [
        'Led development of microservices architecture serving 10M+ users',
        'Reduced API latency by 40% through caching and optimization',
        'Mentored team of 5 junior developers',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'StartupXYZ',
      startDate: 'Jun 2019',
      endDate: 'Dec 2021',
      location: 'Remote',
      achievements: [
        'Built real-time collaboration features using WebSockets',
        'Implemented CI/CD pipelines reducing deployment time by 60%',
      ],
    },
  ],
  projects: [
    {
      name: 'ResumeBuddy',
      description: 'AI-powered resume analysis and export platform with multi-provider routing.',
      technologies: ['Next.js', 'TypeScript', 'Firebase', 'AI'],
      githubUrl: 'https://github.com/example/resumebuddy',
      liveDemoUrl: 'https://resumebuddy.app',
      achievements: [
        'AI-powered resume analysis and improvement suggestions',
        'Multi-provider AI system with automatic fallback',
      ],
    },
    {
      name: 'DevDashboard',
      description: 'Real-time engineering metrics dashboard integrating delivery and reliability signals.',
      technologies: ['React', 'Node.js', 'PostgreSQL'],
      githubUrl: 'https://github.com/example/devdashboard',
      liveDemoUrl: 'https://devdashboard.example.com',
      achievements: [
        'Real-time analytics dashboard for development teams',
        'Integrated with GitHub, Jira, and Slack APIs',
      ],
    },
  ],
  education: [
    {
      degree: 'B.S. Computer Science',
      major: 'Software Engineering',
      institution: 'Stanford University',
      graduationDate: 'May 2019',
      gpa: '3.85',
      coursework: 'Data Structures, Algorithms, Machine Learning, Distributed Systems',
    },
  ],
  educationAndCertifications: {
    certifications: [
      {
        name: 'AWS Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2023',
      },
      {
        name: 'Google Cloud Professional',
        issuer: 'Google',
        date: '2022',
      },
    ],
  },
};

const payload = {
  source: 'resumeData',
  templateId: 'faang',
  resumeData,
  options: {
    engine: 'tectonic',
    return: ['latex', 'pdf'],
    fileBaseName: 'Resume-FAANG',
  },
};

try {
  console.log(`[faang-test] POST ${endpoint}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('[faang-test] Service error:', {
      status: res.status,
      message: json?.message || json?.error?.message || res.statusText,
    });
    process.exit(1);
  }

  console.log('[faang-test] OK');
  console.log('[faang-test] latexSource chars:', json.latexSource?.length);
  console.log('[faang-test] pdf bytes:', json.pdfBase64?.length);

  // Write output
  const fs = await import('node:fs/promises');
  const texPath = new URL('./.latex-faang-output.tex', import.meta.url);
  const pdfPath = new URL('./.latex-faang-output.pdf', import.meta.url);
  await fs.writeFile(texPath, json.latexSource, 'utf8');
  await fs.writeFile(pdfPath, Buffer.from(json.pdfBase64, 'base64'));
  console.log('[faang-test] wrote scripts/.latex-faang-output.{tex,pdf}');

  // Print LaTeX source for inspection
  console.log('\n--- LATEX SOURCE ---');
  console.log(json.latexSource);
  console.log('--- END LATEX SOURCE ---\n');

} catch (err) {
  console.error('[faang-test] Failed:', err);
  process.exit(1);
}
