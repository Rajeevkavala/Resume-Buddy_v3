/**
 * Test FAANG template with raw text input (=== SECTION === format).
 * 
 * Usage:
 *   LATEX_SERVICE_URL=http://localhost:8080 node scripts/latex-faang-text-test.mjs
 */

const serviceUrl = process.env.LATEX_SERVICE_URL || 'http://localhost:8080';
const endpoint = serviceUrl.replace(/\/+$/, '') + '/v1/resume/latex/compile';

// Raw resume text in === SECTION === format
const resumeText = `=== RAJEEV KAVALA ===
rajeevkavala37@gmail.com | +91 9346574012 | LinkedIn: linkedin.com/in/rajeevkavala | Hyderabad

=== PROFESSIONAL SUMMARY ===
Aspiring Full-stack Developer with 1+ year of experience building scalable web applications, proficient in JavaScript, Python, and cloud architecture, with a proven track record of improving system performance.

=== TECHNICAL SKILLS ===
Programming Languages: JavaScript, Python, HTML, CSS
Frontend: React, Vue, Angular
Backend: Node.js, Express
Databases: MongoDB, SQL
Cloud & DevOps: AWS, Azure, GCP, Docker, CI/CD
Tools: Git, GraphQL, API

=== PROFESSIONAL EXPERIENCE ===
Intern | Company Name | Hyderabad | 2024
• Developed a web application using React and Node.js, resulting in a 30% increase in user engagement.
• Implemented frontend development, fixing bugs and improving code quality by 25%.
• Deployed backend development, integrating MongoDB and SQL databases, and reducing data retrieval time by 40%.
• Integrated business intelligence to optimize code functionality, resulting in a 20% increase in operational efficiency.

=== PROJECTS ===
NoteAura | React, Node.js, MongoDB
• Description: Note-taking app with secure login and real-time sync for students and professionals.
• Achievement: Implemented payments using GraphQL integrations, increasing revenue by 15%.
• Achievement: Deployed on AWS with CI/CD, reducing deployment time by 50%.
• GitHub: https://github.com/rajeevkavala/NoteAura | Live: https://noteaura.herokuapp.com

E-Commerce Website | React, Node.js, MongoDB
• Description: E-commerce platform with cart, checkout, and order tracking for small businesses.
• Achievement: Built product recommendations improving conversion by 10%.
• Achievement: Deployed on Azure with optimized caching, cutting deploy time by 30%.
• GitHub: https://github.com/rajeevkavala/Ecommerce | Live: https://ecommerce.herokuapp.com

=== EDUCATION ===
B.Tech in Computer Science | Malla Reddy University | 2023 - Present
GPA: 3.5/4 | Coursework: Data Structures, Algorithms, Computer Networks, Database Systems

=== CERTIFICATIONS ===
• Certified Scrum Master - Scrum Alliance - 2024
• Certified AWS Developer - Amazon Web Services - 2024
`;

const payload = {
  source: 'resumeText',
  templateId: 'faang',
  resumeText,
  options: {
    engine: 'tectonic',
    return: ['latex', 'pdf'],
    fileBaseName: 'Resume-FAANG-Text',
  },
};

try {
  console.log(`[faang-text-test] POST ${endpoint}`);

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
    console.error('[faang-text-test] Service error:', {
      status: res.status,
      message: json?.message || json?.error?.message || res.statusText,
      body: json,
    });
    process.exit(1);
  }

  console.log('[faang-text-test] OK');
  console.log('[faang-text-test] latexSource chars:', json.latexSource?.length);
  console.log('[faang-text-test] pdf bytes:', json.pdfBase64?.length);

  // Write output
  const fs = await import('node:fs/promises');
  const texPath = new URL('./.latex-faang-text-output.tex', import.meta.url);
  const pdfPath = new URL('./.latex-faang-text-output.pdf', import.meta.url);
  await fs.writeFile(texPath, json.latexSource, 'utf8');
  await fs.writeFile(pdfPath, Buffer.from(json.pdfBase64, 'base64'));
  console.log('[faang-text-test] wrote scripts/.latex-faang-text-output.{tex,pdf}');

  // Print LaTeX source for inspection
  console.log('\n--- LATEX SOURCE ---');
  console.log(json.latexSource);
  console.log('--- END LATEX SOURCE ---\n');

} catch (err) {
  console.error('[faang-text-test] Failed:', err);
  process.exit(1);
}
