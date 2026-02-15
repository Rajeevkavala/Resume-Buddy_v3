/**
 * Test FAANG template with STRUCTURED resumeData input.
 * This mimics the new "Structured AI" flow where the editor sends a JSON object.
 * 
 * Usage:
 *   LATEX_SERVICE_URL=http://localhost:8080 node scripts/latex-faang-structured-test.mjs
 */

const serviceUrl = process.env.LATEX_SERVICE_URL || 'http://localhost:8080';
const endpoint = serviceUrl.replace(/\/+$/, '') + '/v1/resume/latex/compile';

const resumeData = {
  personalInfo: {
    fullName: "Rajeev Kavala",
    email: "rajeevkavala37@gmail.com",
    phone: "+91 9346574012",
    location: "Hyderabad, India",
    linkedin: "linkedin.com/in/rajeevkavala",
    github: "github.com/rajeevkavala",
    website: "rajeev.dev"
  },
  summary: "Aspiring Full-stack Developer with 1+ year of experience building scalable web applications.",
  skills: [
    { category: "Languages", items: ["JavaScript", "Python", "TypeScript"] },
    { category: "Frontend", items: ["React", "Next.js", "Tailwind CSS"] },
    { category: "Backend", items: ["Node.js", "Express", "PostgreSQL"] }
  ],
  experience: [
    {
      title: "Software Engineer Intern",
      company: "Tech Corp",
      location: "Bangalore, India",
      startDate: "Jan 2024",
      endDate: "Present",
      current: true,
      achievements: [
        "Optimized database queries reducing latency by 40%.",
        "Implemented real-time notifications using WebSockets."
      ]
    }
  ],
  projects: [
    {
      name: "ResumeBuddy",
      description: "AI-powered resume builder and analyzer.",
      technologies: ["Next.js", "OpenAI", "LaTeX"],
      githubUrl: "https://github.com/rajeevkavala/resume-buddy",
      liveDemoUrl: "https://resumebuddy.ai",
      achievements: [
        "Integrated Llama 3.3 for advanced resume rewriting.",
        "Built a custom LaTeX rendering engine on Cloud Run."
      ]
    }
  ],
  education: [
    {
      degree: "B.Tech Computer Science",
      institution: "Malla Reddy University",
      location: "Hyderabad, Telangana",
      graduationDate: "2025",
      gpa: "3.8/4.0",
      major: "Computer Science",
      relevantCoursework: ["Data Structures", "Algorithms", "OS"]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2024"
    }
  ]
};

const payload = {
  source: 'resumeData',
  templateId: 'faang',
  resumeData,
  options: {
    engine: 'tectonic',
    return: ['latex', 'pdf'],
    fileBaseName: 'Resume-FAANG-Structured',
  },
};

try {
  console.log(`[faang-structured-test] POST ${endpoint}`);

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
    console.error('[faang-structured-test] Service error:', {
      status: res.status,
      message: json?.message || json?.error?.message || res.statusText,
      body: json,
    });
    process.exit(1);
  }

  console.log('[faang-structured-test] OK');
  console.log('[faang-structured-test] latexSource chars:', json.latexSource?.length);
  console.log('[faang-structured-test] pdf bytes:', json.pdfBase64?.length);

  // Write output
  const fs = await import('node:fs/promises');
  const texPath = new URL('./.latex-faang-structured-output.tex', import.meta.url);
  const pdfPath = new URL('./.latex-faang-structured-output.pdf', import.meta.url);
  await fs.writeFile(texPath, json.latexSource, 'utf8');
  await fs.writeFile(pdfPath, Buffer.from(json.pdfBase64, 'base64'));
  console.log('[faang-structured-test] wrote scripts/.latex-faang-structured-output.{tex,pdf}');

} catch (err) {
  console.error('[faang-structured-test] Network error:', err);
  process.exit(1);
}
