import urllib.request
import urllib.error
import json
import time

def test_endpoint(url, payload):
    print(f"\n--- Testing {url} ---")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://www.resume-buddy.tech'
        }
    )
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            body = response.read().decode('utf-8')
            elapsed = time.time() - start
            print(f"Status: {response.status} in {elapsed:.2f}s")
            res_json = json.loads(body)
            print(f"Success! ok={res_json.get('ok')}, pdfBase64 length={len(res_json.get('pdfBase64', ''))}, latexSource length={len(res_json.get('latexSource', ''))}")
            return True
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start
        print(f"HTTPError: {e.code} {e.reason} in {elapsed:.2f}s")
        print(f"Response: {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        elapsed = time.time() - start
        print(f"Error: {e} in {elapsed:.2f}s")
        return False

if __name__ == '__main__':
    payload = {
        "source": "resumeData",
        "templateId": "faang",
        "resumeData": {
            "personalInfo": {
                "fullName": "RAJEEV KAVALA",
                "email": "rajeev.kavala@email.com",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA",
                "linkedin": "linkedin.com/in/rajeevkavala",
                "github": "github.com/rajeevkavala"
            },
            "summary": "Full-stack developer with 5+ years of experience building scalable web applications.",
            "skills": {
                "languages": ["Python", "JavaScript", "TypeScript", "Java", "SQL"],
                "frameworks": ["React", "Next.js", "Node.js", "Express", "FastAPI"],
                "tools": ["Docker", "Kubernetes", "AWS", "GCP", "Git"],
                "databases": ["PostgreSQL", "MongoDB", "Redis", "DynamoDB"]
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
        },
        "options": {
            "engine": "tectonic",
            "return": ["latex", "pdf"],
            "fileBaseName": "Rajeev-Kavala-Resume"
        }
    }

    # Test direct container port
    test_endpoint("http://127.0.0.1:8080/v1/resume/latex/compile", payload)
    
    # Test through Nginx on port 80
    test_endpoint("http://127.0.0.1/v1/resume/latex/compile", payload)
