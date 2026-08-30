import subprocess, os

script = """
docker exec resumebuddy-latex node -e "
import('./dist/latex/serialize.js').then(async ({ serializeToLatex }) => {
  import('./dist/latex/compile.js').then(async ({ compileWithTectonic }) => {
    try {
      const input = {
        source: 'resumeText',
        templateId: 'modern',
        resumeText: 'Rajeev Kavala\\nrajeev@example.com | +91 9346574012 | Hyderabad\\n\\n=== SUMMARY ===\\nFull stack engineer with AWS and React experience.\\n\\n=== SKILLS ===\\nJavaScript, TypeScript, Python, Next.js, Node.js, Docker, AWS Graviton',
        options: { engine: 'tectonic', return: ['latex', 'pdf'] }
      };
      const { latexSource } = serializeToLatex(input);
      console.log('Generated LaTeX length:', latexSource.length);
      const res = await compileWithTectonic(latexSource);
      console.log('SUCCESS! PDF generated with bytes:', res.pdfBytes.length);
    } catch (e) {
      console.error('ERROR:', e);
    }
  });
});
"
"""

ec2_host = os.getenv("PROBE_TARGET_EC2_HOST", os.getenv("EC2_HOST", "13.207.140.19"))
p = subprocess.run(['ssh.exe', '-i', 'resumebuddy-key.pem', f'ubuntu@{ec2_host}', script], capture_output=True, text=True)
print("STDOUT:\n", p.stdout)
print("STDERR:\n", p.stderr)
