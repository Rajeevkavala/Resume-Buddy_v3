#!/usr/bin/env npx ts-node

/**
 * Token Estimator Script for Resume Buddy
 * 
 * Estimates input and output tokens for each AI feature
 * Run: npx ts-node scripts/token-estimator.ts
 * 
 * Features analyzed:
 * - Resume Analysis
 * - Auto-Fill JD (Job Description)
 * - Resume Q&A
 * - Interview Questions
 * - Resume Improvement
 * - Auto-Fill Resume (Parse Resume)
 */

// Token estimation: ~1 token ≈ 4 characters for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Sample resume for testing (average resume length)
const SAMPLE_RESUME = `
John Doe
Software Engineer | john.doe@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience building scalable web applications. 
Expert in React, Node.js, TypeScript, and cloud technologies. Proven track record of improving 
system performance by 40% and leading teams of 8+ developers.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, SQL
Frontend: React, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express, NestJS, FastAPI, Django
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, CI/CD
Tools: Git, JIRA, Figma, VS Code, Postman

PROFESSIONAL EXPERIENCE
Senior Software Engineer | TechCorp Inc. | San Francisco, CA | Jan 2022 - Present
• Architected and developed microservices architecture handling 1M+ daily requests
• Led team of 5 engineers in building real-time analytics dashboard reducing load time by 60%
• Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
• Mentored 3 junior developers improving team velocity by 25%

Software Engineer | StartupXYZ | San Francisco, CA | Jun 2019 - Dec 2021
• Developed React-based customer portal serving 50,000+ monthly active users
• Built RESTful APIs using Node.js and Express with 99.9% uptime
• Optimized database queries reducing response time by 45%
• Integrated third-party payment systems processing $2M+ monthly transactions

Junior Developer | WebAgency Co. | Oakland, CA | Jan 2018 - May 2019
• Created responsive web applications for 20+ client projects
• Implemented automated testing increasing code coverage from 40% to 85%
• Collaborated with designers to implement pixel-perfect UI components

PROJECTS
E-Commerce Platform | React, Node.js, PostgreSQL, AWS
• Built full-stack marketplace supporting 10,000+ products and 5,000+ users
• Implemented search functionality with Elasticsearch achieving sub-100ms response
• Deployed on AWS using Docker containers with auto-scaling

Open Source Contribution | VS Code Extension
• Developed code snippet extension with 10,000+ downloads
• Active maintainer with 50+ merged pull requests

EDUCATION
Bachelor of Science in Computer Science | UC Berkeley | May 2017
GPA: 3.7 | Dean's List | Relevant Coursework: Data Structures, Algorithms, Databases

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2023)
• Google Cloud Professional Developer (2022)
`.trim();

// Sample job description (average length)
const SAMPLE_JOB_DESCRIPTION = `
Senior Software Engineer - Full Stack

About the Role:
We are looking for a talented Senior Software Engineer to join our growing engineering team. 
You will be responsible for designing, developing, and maintaining high-quality web applications.

Responsibilities:
- Design and implement scalable backend services using Node.js and Python
- Build responsive and performant frontend applications using React and TypeScript
- Write clean, maintainable, and well-tested code
- Collaborate with product managers, designers, and other engineers
- Mentor junior team members and conduct code reviews
- Participate in architecture discussions and technical planning
- Deploy and maintain applications on AWS cloud infrastructure
- Optimize application performance and database queries

Required Qualifications:
- 5+ years of software development experience
- Strong proficiency in JavaScript/TypeScript and React
- Experience with Node.js and RESTful API development
- Solid understanding of SQL and NoSQL databases
- Familiarity with AWS services (EC2, S3, Lambda, RDS)
- Experience with Docker and containerization
- Strong problem-solving and communication skills
- BS in Computer Science or equivalent experience

Preferred Qualifications:
- Experience with microservices architecture
- Knowledge of GraphQL
- Experience with Kubernetes
- Familiarity with CI/CD pipelines
- Open source contributions

Benefits:
- Competitive salary: $150,000 - $200,000
- Equity package
- Health, dental, and vision insurance
- 401(k) with company match
- Remote-friendly work environment
- Professional development budget

Employment Type: Full-time
Location: San Francisco, CA (Hybrid)
`.trim();

// Feature configurations matching actual implementation
interface FeatureConfig {
  name: string;
  systemPromptTokens: number;
  inputTokens: {
    resumeMaxTokens: number;
    jdMaxTokens: number;
    additionalPromptTokens: number;
  };
  outputMaxTokens: number;
  description: string;
}

const FEATURES: FeatureConfig[] = [
  {
    name: 'Resume Analysis',
    systemPromptTokens: 50, // "You are an expert ATS analyst..."
    inputTokens: {
      resumeMaxTokens: 1500, // trimmedResume in analyze-resume-content.ts
      jdMaxTokens: 800,      // trimmedJD
      additionalPromptTokens: 800, // Prompt template text
    },
    outputMaxTokens: 3000,
    description: 'Analyzes resume against job description with ATS scoring',
  },
  {
    name: 'Auto-Fill JD',
    systemPromptTokens: 40, // "You are a professional job description analyst..."
    inputTokens: {
      resumeMaxTokens: 0,
      jdMaxTokens: 2500,     // trimmedContent in structure-job-description.ts
      additionalPromptTokens: 600,
    },
    outputMaxTokens: 4000,
    description: 'Structures and parses job description content',
  },
  {
    name: 'Resume Q&A',
    systemPromptTokens: 30, // "Interview coach..."
    inputTokens: {
      resumeMaxTokens: 800,  // topicContext in generate-resume-qa.ts
      jdMaxTokens: 0,
      additionalPromptTokens: 300,
    },
    outputMaxTokens: 2500,
    description: 'Generates Q&A pairs for interview preparation',
  },
  {
    name: 'Interview Questions',
    systemPromptTokens: 30, // "Interview coach..."
    inputTokens: {
      resumeMaxTokens: 400,  // trimmedResume in generate-interview-questions.ts
      jdMaxTokens: 300,      // trimmedJD
      additionalPromptTokens: 400,
    },
    outputMaxTokens: 2500,
    description: 'Generates MCQ interview questions',
  },
  {
    name: 'Resume Improvement',
    systemPromptTokens: 60, // "You are an expert ATS resume writer..."
    inputTokens: {
      resumeMaxTokens: 2000, // trimmedResume in suggest-resume-improvements.ts
      jdMaxTokens: 800,      // trimmedJD
      additionalPromptTokens: 1000, // Long prompt template
    },
    outputMaxTokens: 7000,
    description: 'Suggests and applies resume improvements',
  },
  {
    name: 'Auto-Fill Resume',
    systemPromptTokens: 30, // "Expert resume parser..."
    inputTokens: {
      resumeMaxTokens: 1500, // trimmedResume in parse-resume-intelligently.ts
      jdMaxTokens: 0,
      additionalPromptTokens: 400,
    },
    outputMaxTokens: 2500,
    description: 'Parses resume into structured data',
  },
];

// Calculate actual token estimates
interface TokenEstimate {
  feature: string;
  description: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costPer1000: {
    llama8B: number;
    llama70B: number;
    gpt20B: number;
  };
}

function calculateEstimates(): TokenEstimate[] {
  return FEATURES.map(feature => {
    const inputTokens = 
      feature.systemPromptTokens +
      feature.inputTokens.resumeMaxTokens +
      feature.inputTokens.jdMaxTokens +
      feature.inputTokens.additionalPromptTokens;

    // Typical output is ~60-70% of max tokens allowed
    const outputTokens = Math.round(feature.outputMaxTokens * 0.65);
    const totalTokens = inputTokens + outputTokens;

    // Cost estimates per 1K tokens (approximate Groq pricing)
    // Llama 3.1 8B: ~$0.05/1M input, ~$0.08/1M output (free tier)
    // Llama 3.3 70B: ~$0.59/1M input, ~$0.79/1M output
    // GPT-OSS 20B (approximated): ~$0.20/1M input, ~$0.30/1M output
    const costPer1000 = {
      llama8B: (inputTokens * 0.00005 + outputTokens * 0.00008) / 1000,
      llama70B: (inputTokens * 0.00059 + outputTokens * 0.00079) / 1000,
      gpt20B: (inputTokens * 0.00020 + outputTokens * 0.00030) / 1000,
    };

    return {
      feature: feature.name,
      description: feature.description,
      inputTokens,
      outputTokens,
      totalTokens,
      costPer1000,
    };
  });
}

// Print formatted results
function printResults() {
  const estimates = calculateEstimates();

  console.log('\n' + '='.repeat(100));
  console.log('📊 RESUME BUDDY - TOKEN ESTIMATION REPORT');
  console.log('='.repeat(100));
  
  console.log('\n📋 SAMPLE DATA USED:');
  console.log(`   Resume: ${estimateTokens(SAMPLE_RESUME)} tokens (~${SAMPLE_RESUME.length} chars)`);
  console.log(`   Job Description: ${estimateTokens(SAMPLE_JOB_DESCRIPTION)} tokens (~${SAMPLE_JOB_DESCRIPTION.length} chars)`);

  console.log('\n' + '-'.repeat(105));
  console.log('📈 TOKEN ESTIMATES BY FEATURE');
  console.log('-'.repeat(105));
  console.log(
    'Feature'.padEnd(22) +
    'Input'.padStart(10) +
    'Output'.padStart(10) +
    'Total'.padStart(10) +
    '  │  ' +
    'Primary Model (Provider)'.padEnd(28) +
    'Cost/1K req'.padStart(12)
  );
  console.log('-'.repeat(105));

  // Recommended model mapping based on NEW routing strategy
  // Primary: Groq-only (Llama 8B for simple, 70B for complex)
  // No more OpenRouter dependency!
  const modelMapping: Record<string, { model: string; costKey: 'llama8B' | 'llama70B' }> = {
    'Resume Q&A': { model: 'Llama 3.1 8B (Groq)', costKey: 'llama8B' },
    'Auto-Fill Resume': { model: 'Llama 3.1 8B (Groq)', costKey: 'llama8B' },
    'Auto-Fill JD': { model: 'Llama 3.1 8B (Groq)', costKey: 'llama8B' },
    'Resume Analysis': { model: 'Llama 3.3 70B (Groq)', costKey: 'llama70B' },  // Changed from OpenRouter
    'Resume Improvement': { model: 'Llama 3.3 70B (Groq)', costKey: 'llama70B' },
    'Interview Questions': { model: 'Llama 3.3 70B (Groq)', costKey: 'llama70B' },
  };

  let totalInput = 0;
  let totalOutput = 0;
  let totalCostSmartRouting = 0;
  let totalCost70B = 0;

  estimates.forEach(est => {
    const mapping = modelMapping[est.feature];
    const cost = est.costPer1000[mapping.costKey] * 1000;

    totalInput += est.inputTokens;
    totalOutput += est.outputTokens;
    totalCostSmartRouting += cost;
    totalCost70B += est.costPer1000.llama70B * 1000;

    console.log(
      est.feature.padEnd(22) +
      est.inputTokens.toString().padStart(10) +
      est.outputTokens.toString().padStart(10) +
      est.totalTokens.toString().padStart(10) +
      '  │  ' +
      mapping.model.padEnd(25) +
      `$${cost.toFixed(4)}`.padStart(12)
    );
  });

  console.log('-'.repeat(105));
  console.log(
    'TOTALS (all features)'.padEnd(22) +
    totalInput.toString().padStart(10) +
    totalOutput.toString().padStart(10) +
    (totalInput + totalOutput).toString().padStart(10) +
    '  │  ' +
    'Smart Routing'.padEnd(25) +
    `$${totalCostSmartRouting.toFixed(4)}`.padStart(12)
  );

  console.log('\n' + '='.repeat(105));
  console.log('💰 COST COMPARISON (per 1000 requests using all features)');
  console.log('='.repeat(105));
  console.log(`\n   ❌ Using 70B for everything:      $${totalCost70B.toFixed(2)}`);
  console.log(`   ✅ Using Smart Model Routing:     $${totalCostSmartRouting.toFixed(2)}`);
  console.log(`   💰 Savings:                       $${(totalCost70B - totalCostSmartRouting).toFixed(2)} (${Math.round((1 - totalCostSmartRouting / totalCost70B) * 100)}%)`);

  console.log('\n' + '='.repeat(105));
  console.log('🚀 OPTIMIZED ROUTING (Groq-Only Strategy)');
  console.log('='.repeat(105));
  console.log(`
┌────────────────────────┬──────────────────────────────┬───────────────────────────────────────────────────────┐
│ Feature                │ Primary → Fallback → Last    │ Strategy                                              │
├────────────────────────┼──────────────────────────────┼───────────────────────────────────────────────────────┤
│ Resume Q&A             │ 8B → 70B → Gemini           │ Start cheap, upgrade on failure                       │
│ Auto-Fill Resume       │ 8B → 70B → Gemini           │ Structured extraction doesn't need 70B                │
│ Auto-Fill JD           │ 8B → 70B → Gemini           │ Fast parsing task                                     │
│ Resume Analysis        │ 70B → 8B → Gemini           │ Needs intelligence, downgrade if rate-limited         │
│ Resume Improvement     │ 70B → 8B → Gemini           │ Complex rewriting needs 70B, 8B acceptable            │
│ Interview Questions    │ 70B → 8B → Gemini           │ Quality MCQs prefer 70B, 8B acceptable                │
└────────────────────────┴──────────────────────────────┴───────────────────────────────────────────────────────┘

🛡️  KEY IMPROVEMENTS:
   ✅ Removed OpenRouter dependency (unreliable free tier)
   ✅ 3-tier fallback: Primary → Fallback → Last Resort
   ✅ Token limits enforced per feature (abuse prevention)
   ✅ Direct Groq API calls (no abstraction layer)
   ✅ Realistic output token estimates for cost accuracy
`);

  console.log('\n📊 DAILY USAGE ESTIMATES (Free Tier Capacity)');
  console.log('-'.repeat(60));
  console.log(`   Groq Free Tier:       14,400 requests/day (main provider)`);
  console.log(`   Gemini Free Tier:     1,500 requests/day (last resort)`);
  console.log(`   Combined Capacity:    ~15,900 requests/day`);
  console.log('-'.repeat(60));

  // Estimate requests per user session
  const avgRequestsPerSession = 3; // Typical: analyze + improve + Q&A
  const avgTokensPerSession = Math.round((totalInput + totalOutput) / 6 * avgRequestsPerSession);
  
  console.log(`\n📱 PER-SESSION ESTIMATES (typical user)`);
  console.log(`   Avg requests/session: ${avgRequestsPerSession}`);
  console.log(`   Avg tokens/session:   ~${avgTokensPerSession} tokens`);
  console.log(`   Max daily users:      ~${Math.round(15900 / avgRequestsPerSession)} users (free tier)`);
}

// Run the script
printResults();

console.log('\n✅ Token estimation complete!');
console.log('💡 To reduce costs further, implement caching and request deduplication.\n');
