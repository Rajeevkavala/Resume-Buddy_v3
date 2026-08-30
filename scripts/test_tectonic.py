import subprocess

script = """
docker exec resumebuddy-latex sh -c "echo '\\documentclass{article}\\begin{document}Hello from Tectonic on AWS Graviton!\\end{document}' > /tmp/test.tex && tectonic /tmp/test.tex --outdir /tmp && ls -lh /tmp/test.pdf"
"""

p = subprocess.run(['ssh.exe', '-i', 'resumebuddy-key.pem', 'ubuntu@13.207.140.19', script], capture_output=True, text=True)
print("STDOUT:\n", p.stdout)
print("STDERR:\n", p.stderr)
