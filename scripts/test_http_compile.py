import urllib.request, json, time

payload = {
    "source": "resumeText",
    "templateId": "modern",
    "resumeText": "Rajeev Kavala\nrajeev@example.com | +91 9346574012 | Hyderabad\n\n=== SUMMARY ===\nFull stack engineer with AWS and React experience.\n\n=== SKILLS ===\nJavaScript, TypeScript, Python, Next.js, Node.js, Docker, AWS Graviton",
    "options": {
        "engine": "tectonic",
        "return": ["latex", "pdf"]
    }
}

req = urllib.request.Request(
    "http://13.207.140.19/v1/resume/latex/compile",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

t0 = time.time()
with urllib.request.urlopen(req, timeout=30) as resp:
    duration = time.time() - t0
    data = json.loads(resp.read().decode("utf-8"))
    print(f"HTTP Status: {resp.status} (took {duration:.2f}s)")
    print("Response OK:", data.get("ok"))
    if data.get("pdfBase64"):
        print("PDF Base64 Length:", len(data["pdfBase64"]))
        print("Cached:", data.get("cached", False))
        print("🎉 END-TO-END VERIFICATION PASSED: Full LaTeX PDF compiled & delivered over HTTP!")
