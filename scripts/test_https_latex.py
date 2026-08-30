import urllib.request
import urllib.error
import ssl
import json
import time

def test_https():
    url = "https://api.resume-buddy.tech/v1/resume/latex/compile"
    payload = {
        "source": "resumeData",
        "templateId": "faang",
        "resumeData": {
            "personalInfo": {
                "fullName": "RAJEEV KAVALA",
                "email": "rajeev.kavala@email.com",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA"
            },
            "summary": "Full-stack developer with 5+ years of experience.",
            "skills": {
                "languages": ["TypeScript", "Python"],
                "frameworks": ["Next.js", "React"]
            },
            "experience": [
                {
                    "title": "Senior Software Engineer",
                    "company": "TechCorp",
                    "startDate": "Jan 2022",
                    "achievements": ["Built AWS Graviton microservices architecture"]
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
            "fileBaseName": "Rajeev-Resume"
        }
    }
    
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

    print(f"Sending HTTPS request to {url}...")
    start = time.time()
    # If local DNS is cached, we can connect using IP or direct host
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            elapsed = time.time() - start
            body = res.read().decode('utf-8')
            res_json = json.loads(body)
            print(f"Status: {res.status} in {elapsed:.2f}s")
            print(f"PDF base64 length: {len(res_json.get('pdfBase64', ''))}")
            print(f"LaTeX source length: {len(res_json.get('latexSource', ''))}")
            print("LATEX ENDPOINT VERIFICATION SUCCESSFUL!")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    test_https()
