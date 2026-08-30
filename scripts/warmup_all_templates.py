import urllib.request
import json
import time

TEMPLATES = ['professional', 'faang', 'jake', 'deedy', 'modern', 'minimal', 'tech']

sample_data = {
    "personalInfo": {
        "fullName": "RAJEEV KAVALA",
        "email": "rajeev.kavala@email.com",
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/rajeevkavala",
        "github": "github.com/rajeevkavala",
        "website": "https://resume-buddy.tech"
    },
    "summary": "Full-stack developer with 5+ years of experience building scalable web applications. Proficient in React, Node.js, and cloud technologies.",
    "skills": {
        "languages": ["Python", "JavaScript", "TypeScript", "Java", "SQL"],
        "frameworks": ["React", "Next.js", "Node.js", "Express", "FastAPI"],
        "tools": ["Docker", "Kubernetes", "AWS", "Git"],
        "databases": ["PostgreSQL", "MongoDB", "Redis"]
    },
    "experience": [
        {
            "title": "Senior Software Engineer",
            "company": "TechCorp Inc.",
            "startDate": "Jan 2022",
            "endDate": None,
            "current": True,
            "location": "San Francisco, CA",
            "achievements": [
                "Led development of microservices architecture serving 10M+ users",
                "Reduced API latency by 40% through caching and optimization"
            ]
        },
        {
            "title": "Software Engineer",
            "company": "StartupXYZ",
            "startDate": "Jun 2019",
            "endDate": "Dec 2021",
            "location": "Remote",
            "achievements": [
                "Built real-time collaboration features using WebSockets",
                "Implemented CI/CD pipelines reducing deployment time by 60%"
            ]
        }
    ],
    "projects": [
        {
            "name": "ResumeBuddy",
            "description": "AI-powered resume analysis and export platform.",
            "technologies": ["Next.js", "TypeScript", "AWS"],
            "achievements": [
                "AI-powered resume analysis and improvement suggestions"
            ]
        }
    ],
    "education": [
        {
            "degree": "B.S. Computer Science",
            "institution": "Stanford University",
            "graduationDate": "May 2019"
        }
    ]
}

def warmup():
    print("=== Warming up all 7 LaTeX Templates on AWS Graviton EC2 ===")
    for tid in TEMPLATES:
        payload = {
            "source": "resumeData",
            "templateId": tid,
            "resumeData": sample_data,
            "options": {
                "engine": "tectonic",
                "return": ["latex", "pdf"],
                "fileBaseName": f"Warmup-{tid}"
            }
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            "http://127.0.0.1:8080/v1/resume/latex/compile",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        print(f"\nWarming up template: [{tid}] ...", end=" ", flush=True)
        start = time.time()
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                elapsed = time.time() - start
                res_data = json.loads(res.read().decode('utf-8'))
                print(f"OK ({res.status}) in {elapsed:.2f}s | PDF: {len(res_data.get('pdfBase64', ''))} bytes")
        except Exception as e:
            elapsed = time.time() - start
            print(f"FAILED in {elapsed:.2f}s: {e}")
            if hasattr(e, 'read'):
                print(e.read().decode('utf-8'))

if __name__ == '__main__':
    warmup()
