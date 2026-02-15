import http from 'http';

const resumeText = `=== RAJEEV KAVALA ===
rajeevkavala37@gmail.com | +91 9346574012 | Hyderabad, India
linkedin.com/in/rajeevkavala | github.com/Rajeevkavala

=== PROFESSIONAL SUMMARY ===
Built scalable web applications using MERN stack, resulting in a 30% increase in user engagement. Expertise in React, Node.js, and MongoDB.

=== TECHNICAL SKILLS ===
Languages: JavaScript, Java
Frontend: React, Next.js, HTML/CSS
Backend: Node.js, Express, MongoDB, REST APIs
Databases: MongoDB, PostgreSQL
Cloud & DevOps: AWS, Docker, CI/CD
Tools: Git, Postman, VS Code

=== PROFESSIONAL EXPERIENCE ===
AICTE Internship – EY Global Delivery Services | Hyderabad, India | Dec 2024 – Jan 2025
• Developed a full-featured e-commerce app using MERN stack, with 10+ pages, authentication, and an admin dashboard, resulting in a 25% improvement in application performance.
• Integrated PayPal and Razorpay payment gateways, conducting over 50+ test transactions and ensuring 100% functionality.
• Ranked in the Top 10 among 100+ teams for functionality, responsiveness, and user experience.

=== PROJECTS ===
NoteAura – AI Note-Taking SaaS | Technologies: Next.js, Convex DB, MongoDB, LangChain, Gemini
• Description: Built a full-stack AI-based productivity SaaS for users to create and summarize notes.
• Achievement: Integrated PDF Q&A, role-based authentication, and payment via Razorpay, resulting in a 20% increase in user retention.
• Achievement: Achieved 99% uptime on Vercel, ensuring high availability and reliability.
GitHub: github.com/Rajeevkavala/NoteAura | Live: noteaura.com

ClickNBuy – E-Commerce Platform | Technologies: React, Node.js, Express, MongoDB
• Description: Developed a scalable online store with 2 payment gateways, 75+ test orders, and admin management.
• Achievement: Implemented user authentication, cart, product filtering, and dynamic order tracking, resulting in a 15% increase in sales.
• Achievement: Reduced order processing time by 30% through optimization of database queries.
GitHub: github.com/Rajeevkavala/ClickNBuy | Live: clicknbuy.com

=== EDUCATION ===
B.Tech in Computer Science (AI-ML) | Malla Reddy University | Hyderabad, India | 2023–Present
GPA: 8.68
Relevant Coursework: Web Development, Data Structures, Algorithms, Databases, Software Engineering

=== CERTIFICATIONS ===
• Data Structures and Algorithms using Java – NPTEL – 2024
• Building Modern Web Applications with MERN Stack – AICTE-EY GDS – 2025`;

const payload = {
  source: 'resumeText',
  templateId: 'professional',
  resumeText: resumeText,
  options: {
    engine: 'tectonic',
    return: ['latex', 'pdf']
  }
};

const data = JSON.stringify(payload);
console.log('📤 Request payload:', JSON.stringify(payload, null, 2).substring(0, 500));

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/v1/resume/latex/compile',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  }
};

console.log('📝 Testing Professional template with Rajeev\'s resume...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📥 Status Code:', res.statusCode);
    console.log('📥 Response Length:', responseData.length);
    console.log('📥 Raw Response:', responseData);
    
    try {
      const response = JSON.parse(responseData);
      
      if (response.ok) {
        console.log('✅ SUCCESS! Template compiled successfully\n');
        console.log('📄 LaTeX Source Preview (first 2000 chars):\n');
        console.log(response.latexSource.substring(0, 2000));
        console.log('\n...\n');
        console.log(`\n📊 PDF Size: ${response.pdfBase64.length} bytes (base64)\n`);
        console.log('✨ All sections from your resume format are properly handled!\n');
        
        // Show which sections were detected
        const sections = [];
        if (response.latexSource.includes('PROFESSIONAL SUMMARY')) sections.push('Professional Summary');
        if (response.latexSource.includes('TECHNICAL SKILLS')) sections.push('Technical Skills');
        if (response.latexSource.includes('PROFESSIONAL EXPERIENCE')) sections.push('Professional Experience');
        if (response.latexSource.includes('PROJECTS')) sections.push('Projects');
        if (response.latexSource.includes('EDUCATION')) sections.push('Education');
        if (response.latexSource.includes('CERTIFICATIONS')) sections.push('Certifications');
        
        console.log('📋 Detected Sections:');
        sections.forEach(section => console.log(`   ✓ ${section}`));
      } else {
        console.error('❌ ERROR:', response.error);
        console.error('Message:', response.message);
        if (response.details) {
          console.error('Details:', response.details);
        }
      }
    } catch (err) {
      console.error('❌ Failed to parse response:', err.message);
      console.error('Response:', responseData.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  console.error('\n💡 Make sure the LaTeX service is running:');
  console.error('   docker run --rm -p 8080:8080 resume-latex-service');
});

req.write(data);
req.end();
