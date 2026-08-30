import subprocess, os

script = """
docker exec resumebuddy-latex sh -c "echo '\\documentclass{article}\\begin{document}Hello from Tectonic on AWS Graviton!\\end{document}' > /tmp/test.tex && tectonic /tmp/test.tex --outdir /tmp && ls -lh /tmp/test.pdf"
"""

ec2_host = os.getenv("PROBE_TARGET_EC2_HOST", os.getenv("EC2_HOST", "13.207.140.19"))
p = subprocess.run(['ssh.exe', '-i', 'resumebuddy-key.pem', f'ubuntu@{ec2_host}', script], capture_output=True, text=True)
print("STDOUT:\n", p.stdout)
print("STDERR:\n", p.stderr)
