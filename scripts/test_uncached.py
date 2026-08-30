import urllib.request
import json
import time
import random

TEMPLATES = ['professional', 'faang', 'jake', 'deedy', 'modern', 'minimal', 'tech']

def test_uncached():
    print("=== Testing Uncached Full Compilation for all 7 Templates ===")
    for tid in TEMPLATES:
        rand_id = random.randint(1000, 9999)
        payload = {
            "source": "resumeData",
            "templateId": tid,
            "resumeData": {
                "personalInfo": {
                    "fullName": f"User {rand_id}",
                    "email": f"user{rand_id}@example.com",
                    "phone": "+1 555 987 6543",
                    "location": "New York, NY"
                },
                "summary": "Experienced engineer with a passion for high-performance cloud architectures.",
                "skills": {
                    "languages": ["Rust", "Go", "TypeScript"],
                    "frameworks": ["Next.js", "Actix", "FastAPI"]
                },
                "experience": [
                    {
                        "title": "Lead Infrastructure Architect",
                        "company": "CloudScale Inc.",
                        "startDate": "Mar 2021",
                        "achievements": [
                            "Optimized Graviton EC2 compilation pipeline to sub-second speeds",
                            "Scaled backend services to 50,000+ daily exports"
                        ]
                    }
                ],
                "education": [
                    {
                        "degree": "M.S. Computer Engineering",
                        "institution": "MIT",
                        "graduationDate": "2020"
                    }
                ]
            },
            "options": {
                "engine": "tectonic",
                "return": ["latex", "pdf"],
                "fileBaseName": f"Resume-{rand_id}"
            }
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            "http://127.0.0.1:8080/v1/resume/latex/compile",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        start = time.time()
        with urllib.request.urlopen(req, timeout=30) as res:
            elapsed = time.time() - start
            res_data = json.loads(res.read().decode('utf-8'))
            print(f"Template [{tid}]: Compiled in {elapsed:.2f}s (PDF: {len(res_data.get('pdfBase64', ''))} bytes)")

if __name__ == '__main__':
    test_uncached()
