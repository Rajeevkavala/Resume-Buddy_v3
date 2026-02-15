import { JobRole } from './types';

export interface JobDescriptionPreset {
  role: JobRole;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  benefits?: string[];
}

export const jobDescriptionPresets: Record<JobRole, JobDescriptionPreset> = {
  "Frontend Developer": {
    role: "Frontend Developer",
    title: "Frontend Developer",
    description: "We are seeking a talented Frontend Developer to join our team and help build exceptional user experiences. You will work closely with designers, backend developers, and product managers to create responsive, performant, and accessible web applications.",
    responsibilities: [
      "Develop and maintain responsive web applications using modern JavaScript frameworks",
      "Collaborate with UX/UI designers to translate designs into high-quality code",
      "Optimize applications for maximum speed and scalability",
      "Ensure the technical feasibility of UI/UX designs",
      "Write clean, maintainable, and well-documented code",
      "Participate in code reviews and contribute to team best practices",
      "Debug and troubleshoot cross-browser compatibility issues",
      "Stay up-to-date with emerging frontend technologies and industry trends"
    ],
    requirements: [
      "3+ years of professional experience in frontend development",
      "Strong proficiency in HTML5, CSS3, and modern JavaScript (ES6+)",
      "Experience with React, Vue.js, or Angular frameworks",
      "Understanding of responsive design principles and mobile-first development",
      "Familiarity with version control systems (Git)",
      "Knowledge of build tools (Webpack, Vite, or Parcel)",
      "Experience with CSS preprocessors (Sass, Less) or CSS-in-JS solutions",
      "Understanding of web accessibility standards (WCAG)",
      "Strong problem-solving skills and attention to detail"
    ],
    niceToHave: [
      "Experience with TypeScript",
      "Knowledge of testing frameworks (Jest, Cypress, Testing Library)",
      "Familiarity with state management libraries (Redux, Zustand, Pinia)",
      "Experience with Server-Side Rendering (SSR) or Static Site Generation (SSG)",
      "Understanding of GraphQL and REST APIs",
      "Experience with design systems and component libraries",
      "Knowledge of performance optimization techniques",
      "Contributions to open-source projects"
    ],
    benefits: [
      "Competitive salary and equity compensation",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work arrangements with remote options",
      "Professional development budget for courses and conferences",
      "Latest development tools and equipment",
      "Collaborative and innovative work environment"
    ]
  },
  
  "Backend Developer": {
    role: "Backend Developer",
    title: "Backend Developer",
    description: "We are looking for an experienced Backend Developer to design, build, and maintain scalable server-side applications and APIs. You will work on challenging problems involving data architecture, system performance, and security.",
    responsibilities: [
      "Design and implement robust, scalable server-side applications",
      "Develop and maintain RESTful APIs and microservices",
      "Optimize database queries and schema design for performance",
      "Implement authentication, authorization, and security best practices",
      "Write comprehensive unit and integration tests",
      "Collaborate with frontend developers to integrate user-facing elements",
      "Monitor and troubleshoot production systems",
      "Participate in architectural decisions and code reviews"
    ],
    requirements: [
      "3+ years of backend development experience",
      "Strong proficiency in at least one server-side language (Node.js, Python, Java, C#, Go)",
      "Experience with relational databases (PostgreSQL, MySQL) and SQL",
      "Knowledge of NoSQL databases (MongoDB, Redis, DynamoDB)",
      "Understanding of RESTful API design principles",
      "Experience with cloud platforms (AWS, Azure, or GCP)",
      "Familiarity with containerization technologies (Docker)",
      "Understanding of microservices architecture",
      "Strong debugging and problem-solving skills"
    ],
    niceToHave: [
      "Experience with GraphQL",
      "Knowledge of message queues (RabbitMQ, Kafka, SQS)",
      "Familiarity with Kubernetes and container orchestration",
      "Experience with serverless architectures (Lambda, Cloud Functions)",
      "Understanding of CI/CD pipelines",
      "Knowledge of event-driven architectures",
      "Experience with load balancing and caching strategies",
      "Contributions to open-source backend frameworks"
    ],
    benefits: [
      "Competitive compensation with performance bonuses",
      "Comprehensive benefits package",
      "Remote-first culture with flexible hours",
      "Learning and development opportunities",
      "Modern tech stack and cloud infrastructure",
      "Collaborative team environment"
    ]
  },

  "Full Stack Developer": {
    role: "Full Stack Developer",
    title: "Full Stack Developer",
    description: "Join our team as a Full Stack Developer where you'll work across the entire technology stack to build complete, end-to-end solutions. You'll have the opportunity to work on both frontend and backend systems, contributing to all aspects of our applications.",
    responsibilities: [
      "Design and develop full-stack web applications from conception to deployment",
      "Build responsive user interfaces using modern frontend frameworks",
      "Develop scalable backend services and APIs",
      "Design and optimize database schemas and queries",
      "Implement security and data protection measures",
      "Write automated tests and maintain code quality",
      "Deploy and maintain applications on cloud platforms",
      "Collaborate with cross-functional teams on feature development"
    ],
    requirements: [
      "4+ years of full-stack development experience",
      "Frontend: Proficiency with React, Vue.js, or Angular and modern JavaScript/TypeScript",
      "Backend: Experience with Node.js, Python, or Java",
      "Database: Strong knowledge of both SQL and NoSQL databases",
      "Cloud: Familiarity with AWS, Azure, or GCP",
      "Version control proficiency with Git",
      "Understanding of RESTful API design and integration",
      "Experience with agile development methodologies",
      "Strong communication and teamwork skills"
    ],
    niceToHave: [
      "Experience with DevOps tools and practices",
      "Knowledge of Docker and Kubernetes",
      "Familiarity with CI/CD pipelines",
      "Experience with GraphQL",
      "Understanding of system architecture and design patterns",
      "Mobile development experience (React Native, Flutter)",
      "Knowledge of testing frameworks across the stack",
      "Experience with real-time applications (WebSockets, SSE)"
    ],
    benefits: [
      "Competitive salary with equity options",
      "Comprehensive health and wellness benefits",
      "Flexible remote work policy",
      "Professional development budget",
      "Latest tools and technologies",
      "Vibrant team culture with regular events"
    ]
  },

  "DevOps Engineer": {
    role: "DevOps Engineer",
    title: "DevOps Engineer",
    description: "We're seeking a skilled DevOps Engineer to help us build, deploy, and maintain our infrastructure and deployment pipelines. You'll work to automate processes, improve system reliability, and enable our development teams to ship faster and more confidently.",
    responsibilities: [
      "Design, implement, and maintain CI/CD pipelines",
      "Manage and optimize cloud infrastructure (AWS, Azure, or GCP)",
      "Implement infrastructure as code using tools like Terraform or CloudFormation",
      "Monitor system performance and implement logging/alerting solutions",
      "Automate deployment processes and improve release efficiency",
      "Ensure security best practices and compliance standards",
      "Troubleshoot production issues and provide on-call support",
      "Collaborate with development teams to improve deployment processes"
    ],
    requirements: [
      "3+ years of DevOps or Site Reliability Engineering experience",
      "Strong experience with cloud platforms (AWS, Azure, or GCP)",
      "Proficiency with Infrastructure as Code tools (Terraform, CloudFormation, Pulumi)",
      "Experience with container technologies (Docker, Kubernetes)",
      "Knowledge of CI/CD tools (Jenkins, GitLab CI, GitHub Actions)",
      "Scripting skills in Python, Bash, or PowerShell",
      "Understanding of networking, security, and system administration",
      "Experience with monitoring tools (Prometheus, Grafana, CloudWatch)",
      "Strong problem-solving and debugging skills"
    ],
    niceToHave: [
      "Experience with service mesh technologies (Istio, Linkerd)",
      "Knowledge of configuration management tools (Ansible, Chef, Puppet)",
      "Familiarity with GitOps practices and tools (ArgoCD, Flux)",
      "Experience with serverless architectures",
      "Understanding of compliance frameworks (SOC2, HIPAA, PCI-DSS)",
      "Knowledge of chaos engineering principles",
      "Experience with cost optimization in cloud environments",
      "Contributions to DevOps open-source projects"
    ],
    benefits: [
      "Competitive compensation package",
      "Comprehensive health benefits",
      "Remote work flexibility",
      "Professional certification sponsorship",
      "Access to latest DevOps tools and platforms",
      "Collaborative engineering culture"
    ]
  },

  "Data Scientist": {
    role: "Data Scientist",
    title: "Data Scientist",
    description: "Join our data team as a Data Scientist where you'll analyze complex datasets, build predictive models, and derive actionable insights to drive business decisions. You'll work with cutting-edge tools and technologies to solve challenging problems.",
    responsibilities: [
      "Analyze large datasets to identify trends, patterns, and insights",
      "Develop and deploy machine learning models and algorithms",
      "Create data visualizations and dashboards for stakeholders",
      "Collaborate with engineering teams to productionize models",
      "Conduct A/B tests and statistical analyses",
      "Clean, preprocess, and validate data from various sources",
      "Present findings and recommendations to technical and non-technical audiences",
      "Stay current with latest data science techniques and tools"
    ],
    requirements: [
      "3+ years of experience in data science or analytics",
      "Strong proficiency in Python or R for data analysis",
      "Experience with machine learning libraries (scikit-learn, TensorFlow, PyTorch)",
      "Knowledge of SQL and database querying",
      "Understanding of statistical methods and experimental design",
      "Experience with data visualization tools (Matplotlib, Seaborn, Tableau, Power BI)",
      "Familiarity with big data technologies (Spark, Hadoop)",
      "Strong mathematical and analytical skills",
      "Master's degree in Computer Science, Statistics, Mathematics, or related field (or equivalent experience)"
    ],
    niceToHave: [
      "PhD in a quantitative field",
      "Experience with deep learning and neural networks",
      "Knowledge of NLP or computer vision techniques",
      "Familiarity with cloud ML platforms (AWS SageMaker, Azure ML, GCP AI)",
      "Experience with MLOps practices and tools",
      "Understanding of feature engineering and model optimization",
      "Knowledge of time series analysis and forecasting",
      "Published research or contributions to data science community"
    ],
    benefits: [
      "Competitive salary with performance incentives",
      "Comprehensive benefits package",
      "Flexible work arrangements",
      "Access to advanced computing resources",
      "Conference and publication support",
      "Collaborative research environment"
    ]
  },

  "Mobile Developer": {
    role: "Mobile Developer",
    title: "Mobile Developer",
    description: "We're looking for a talented Mobile Developer to create outstanding mobile experiences for our users. You'll work on native or cross-platform applications, ensuring high performance, responsiveness, and quality.",
    responsibilities: [
      "Design and develop mobile applications for iOS and/or Android",
      "Write clean, maintainable, and well-documented code",
      "Collaborate with designers to implement pixel-perfect UIs",
      "Optimize applications for performance and battery efficiency",
      "Integrate with backend APIs and third-party services",
      "Implement app analytics and crash reporting",
      "Test applications on various devices and OS versions",
      "Publish and maintain apps on App Store and Google Play"
    ],
    requirements: [
      "3+ years of mobile development experience",
      "Proficiency in Swift/Objective-C for iOS or Kotlin/Java for Android",
      "OR experience with cross-platform frameworks (React Native, Flutter)",
      "Understanding of mobile UI/UX principles and guidelines",
      "Experience with RESTful APIs and mobile networking",
      "Knowledge of mobile app architecture patterns (MVC, MVVM, Clean Architecture)",
      "Familiarity with version control and Git workflow",
      "Understanding of app lifecycle and memory management",
      "Strong debugging and performance optimization skills"
    ],
    niceToHave: [
      "Experience with both iOS and Android platforms",
      "Knowledge of SwiftUI or Jetpack Compose",
      "Familiarity with mobile CI/CD pipelines",
      "Experience with push notifications and background tasks",
      "Understanding of mobile security best practices",
      "Knowledge of offline-first architectures and data synchronization",
      "Experience with in-app purchases and subscription models",
      "Published apps on App Store or Google Play"
    ],
    benefits: [
      "Competitive compensation with bonuses",
      "Comprehensive health insurance",
      "Remote work options",
      "Latest devices for development and testing",
      "Professional development opportunities",
      "Innovative and supportive team"
    ]
  },

  "UI/UX Designer": {
    role: "UI/UX Designer",
    title: "UI/UX Designer",
    description: "Join our design team to create beautiful, intuitive, and user-centered experiences. You'll work on everything from user research to high-fidelity prototypes, collaborating closely with product and engineering teams.",
    responsibilities: [
      "Conduct user research and usability testing",
      "Create user personas, journey maps, and user flows",
      "Design wireframes, mockups, and interactive prototypes",
      "Develop and maintain design systems and component libraries",
      "Collaborate with developers to ensure design implementation",
      "Conduct design reviews and iterate based on feedback",
      "Create responsive designs for web and mobile platforms",
      "Present design concepts to stakeholders"
    ],
    requirements: [
      "3+ years of UI/UX design experience",
      "Strong portfolio demonstrating user-centered design process",
      "Proficiency with design tools (Figma, Sketch, Adobe XD)",
      "Understanding of design principles, typography, and color theory",
      "Experience with user research methodologies",
      "Knowledge of usability testing and A/B testing",
      "Understanding of accessibility standards (WCAG)",
      "Strong communication and presentation skills",
      "Ability to work collaboratively in cross-functional teams"
    ],
    niceToHave: [
      "Experience with prototyping tools (Principle, Framer, ProtoPie)",
      "Knowledge of HTML, CSS, and basic frontend development",
      "Familiarity with motion design and micro-interactions",
      "Experience with design systems at scale",
      "Understanding of Material Design and Human Interface Guidelines",
      "Knowledge of design thinking methodologies",
      "Experience conducting workshops and design sprints",
      "Background in graphic design or visual arts"
    ],
    benefits: [
      "Competitive salary and benefits",
      "Creative and collaborative work environment",
      "Flexible work arrangements",
      "Professional development budget",
      "Latest design tools and software",
      "Impact-driven design culture"
    ]
  },

  "Product Manager": {
    role: "Product Manager",
    title: "Product Manager",
    description: "We're seeking an experienced Product Manager to drive product strategy and execution. You'll work with cross-functional teams to deliver products that delight users and drive business growth.",
    responsibilities: [
      "Define product vision, strategy, and roadmap",
      "Conduct market research and competitive analysis",
      "Gather and prioritize product requirements",
      "Work closely with engineering, design, and business teams",
      "Define and track key product metrics and KPIs",
      "Manage product launches and go-to-market strategies",
      "Conduct user interviews and analyze feedback",
      "Make data-driven decisions to optimize product performance"
    ],
    requirements: [
      "4+ years of product management experience",
      "Proven track record of shipping successful products",
      "Strong analytical and problem-solving skills",
      "Excellent communication and stakeholder management",
      "Experience with agile/scrum methodologies",
      "Understanding of user-centered design principles",
      "Ability to translate business needs into product requirements",
      "Data-driven decision making capabilities",
      "Bachelor's degree in Business, Computer Science, or related field (or equivalent experience)"
    ],
    niceToHave: [
      "MBA or advanced degree",
      "Technical background or engineering experience",
      "Experience with product analytics tools (Mixpanel, Amplitude, Google Analytics)",
      "Knowledge of A/B testing and experimentation frameworks",
      "Experience with B2B or B2C SaaS products",
      "Familiarity with product management frameworks (Jobs-to-be-Done, OKRs)",
      "Experience in startup or high-growth environments",
      "Strong network in the product community"
    ],
    benefits: [
      "Competitive compensation with equity",
      "Comprehensive benefits package",
      "Flexible work environment",
      "Leadership development programs",
      "Impact on product direction",
      "Collaborative culture"
    ]
  },

  "QA Engineer": {
    role: "QA Engineer",
    title: "QA Engineer / Quality Assurance Engineer",
    description: "Join our quality team to ensure we deliver high-quality, bug-free software to our users. You'll design test strategies, automate tests, and work closely with development teams to maintain quality standards.",
    responsibilities: [
      "Design and execute comprehensive test plans and test cases",
      "Develop and maintain automated test suites",
      "Perform functional, regression, and performance testing",
      "Identify, document, and track bugs and issues",
      "Collaborate with developers to resolve quality issues",
      "Participate in code reviews and design discussions",
      "Implement and improve QA processes and methodologies",
      "Monitor and report on quality metrics"
    ],
    requirements: [
      "3+ years of QA or test automation experience",
      "Experience with test automation frameworks (Selenium, Cypress, Playwright)",
      "Knowledge of programming languages for test automation (JavaScript, Python, Java)",
      "Understanding of software testing methodologies and best practices",
      "Experience with API testing tools (Postman, REST Assured)",
      "Familiarity with CI/CD pipelines and integration testing",
      "Strong analytical and problem-solving skills",
      "Excellent attention to detail",
      "Good communication skills for bug reporting and collaboration"
    ],
    niceToHave: [
      "Experience with performance testing tools (JMeter, LoadRunner, k6)",
      "Knowledge of mobile testing (Appium, XCUITest, Espresso)",
      "Familiarity with BDD frameworks (Cucumber, SpecFlow)",
      "Experience with visual regression testing",
      "Understanding of security testing principles",
      "Knowledge of containerization and testing in Docker",
      "ISTQB certification or equivalent",
      "Experience with test management tools (TestRail, Zephyr)"
    ],
    benefits: [
      "Competitive salary and benefits",
      "Remote work flexibility",
      "Professional certification support",
      "Quality-first engineering culture",
      "Access to latest testing tools",
      "Continuous learning opportunities"
    ]
  },

  "Software Engineer": {
    role: "Software Engineer",
    title: "Software Engineer",
    description: "We're hiring Software Engineers to join our growing engineering team. You'll work on challenging problems, build scalable systems, and contribute to products used by millions of users.",
    responsibilities: [
      "Design, develop, and deploy software solutions",
      "Write clean, efficient, and maintainable code",
      "Collaborate with team members on technical design and architecture",
      "Participate in code reviews and contribute to engineering standards",
      "Debug and resolve technical issues",
      "Write comprehensive tests and documentation",
      "Optimize application performance and scalability",
      "Stay updated with new technologies and best practices"
    ],
    requirements: [
      "3+ years of software engineering experience",
      "Strong proficiency in one or more programming languages (Java, Python, JavaScript, Go, C++)",
      "Understanding of data structures, algorithms, and design patterns",
      "Experience with version control systems (Git)",
      "Knowledge of software development lifecycle",
      "Strong problem-solving and analytical skills",
      "Good communication and teamwork abilities",
      "Bachelor's degree in Computer Science or related field (or equivalent experience)"
    ],
    niceToHave: [
      "Experience with cloud platforms (AWS, Azure, GCP)",
      "Knowledge of microservices architecture",
      "Familiarity with containerization technologies",
      "Experience with both frontend and backend development",
      "Understanding of CI/CD practices",
      "Contributions to open-source projects",
      "Experience with agile methodologies",
      "Advanced degree in Computer Science or related field"
    ],
    benefits: [
      "Competitive compensation and equity",
      "Comprehensive benefits package",
      "Flexible work arrangements",
      "Learning and development budget",
      "Modern tech stack",
      "Collaborative engineering culture"
    ]
  },

  "Other": {
    role: "Other",
    title: "Professional Position",
    description: "We are seeking a motivated professional to join our team. This role offers an exciting opportunity to contribute to meaningful projects and grow your career in a dynamic environment.",
    responsibilities: [
      "Contribute to team objectives and project deliverables",
      "Collaborate with cross-functional teams",
      "Take ownership of assigned tasks and projects",
      "Participate in team meetings and planning sessions",
      "Maintain high standards of quality and professionalism",
      "Continuously learn and adapt to new challenges",
      "Communicate effectively with team members and stakeholders",
      "Support company goals and initiatives"
    ],
    requirements: [
      "Relevant experience in your field of expertise",
      "Strong problem-solving and analytical skills",
      "Excellent communication and interpersonal abilities",
      "Ability to work independently and as part of a team",
      "Strong organizational and time management skills",
      "Adaptability and willingness to learn",
      "Professional demeanor and work ethic",
      "Relevant educational background or equivalent experience"
    ],
    niceToHave: [
      "Industry-specific certifications or qualifications",
      "Experience with relevant tools and technologies",
      "Demonstrated leadership or mentoring experience",
      "Track record of successful project delivery",
      "Strong network in your professional community",
      "Continuous learning mindset",
      "Experience in collaborative environments",
      "Additional language skills"
    ],
    benefits: [
      "Competitive compensation package",
      "Comprehensive benefits",
      "Flexible work arrangements",
      "Professional development opportunities",
      "Supportive team environment",
      "Growth and advancement opportunities"
    ]
  }
};

/**
 * Get a formatted job description for a given role
 */
export function getJobDescriptionForRole(role: JobRole): string {
  const preset = jobDescriptionPresets[role];
  
  return `
# ${preset.title}

## About the Role
${preset.description}

## Key Responsibilities
${preset.responsibilities.map(r => `• ${r}`).join('\n')}

## Required Qualifications
${preset.requirements.map(r => `• ${r}`).join('\n')}

## Nice to Have
${preset.niceToHave.map(n => `• ${n}`).join('\n')}

${preset.benefits ? `
## Benefits & Perks
${preset.benefits.map(b => `• ${b}`).join('\n')}
` : ''}

## About Us
We are committed to building a diverse and inclusive workplace where everyone can thrive. We value innovation, collaboration, and continuous learning. Join us in making an impact!
`.trim();
}

/**
 * Check if a job description is a preset or very short/missing
 */
export function shouldUsePreset(jobDescription: string, jobRole?: JobRole | ''): boolean {
  if (!jobDescription || jobDescription.trim().length < 100) {
    return !!jobRole && jobRole.length > 0;
  }
  return false;
}
