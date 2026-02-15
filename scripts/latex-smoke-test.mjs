/**
 * LaTeX service smoke test (server-only).
 *
 * Usage:
 *   LATEX_SERVICE_URL=https://... npm run latex:smoke
 *
 * Optional env:
 *   LATEX_TEMPLATE_ID=professional
 *   LATEX_WRITE_OUTPUT=1  (writes ./scripts/.latex-smoke-output.{tex,pdf})
 */

const serviceUrl = process.env.LATEX_SERVICE_URL;
if (!serviceUrl || !serviceUrl.trim()) {
  console.error('Missing LATEX_SERVICE_URL env var.');
  process.exit(1);
}

const templateId = (process.env.LATEX_TEMPLATE_ID || 'professional').trim();

const endpoint = serviceUrl.replace(/\/+$/, '') + '/v1/resume/latex/compile';

const resumeText = `John Doe
john.doe@example.com | +1 (555) 555-5555 | City, ST

SUMMARY
Software engineer with experience building web applications.

EXPERIENCE
Acme Corp — Software Engineer (2022–Present)
- Built and shipped features in a Next.js application.
- Improved performance and reliability.

EDUCATION
B.S. Computer Science — Example University (2018–2022)
`;

const payload = {
  source: 'resumeText',
  templateId,
  resumeText,
  options: {
    engine: 'tectonic',
    return: ['latex', 'pdf'],
    fileBaseName: 'Resume-Enhanced',
  },
};

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function decodeBase64ToBuffer(b64) {
  // Node supports both base64 and base64url in some contexts; we only accept base64.
  return Buffer.from(b64, 'base64');
}

try {
  console.log(`[latex-smoke] POST ${endpoint}`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error?.message ||
      (typeof json?.error === 'string' ? json.error : undefined) ||
      res.statusText ||
      'Request failed';
    console.error('[latex-smoke] Service error:', {
      status: res.status,
      message: msg,
      body: json ?? text,
    });
    process.exit(1);
  }

  assert(json && typeof json === 'object', 'Response is not JSON.');
  assert(typeof json.latexSource === 'string' && json.latexSource.length > 0, 'Missing latexSource.');
  assert(typeof json.pdfBase64 === 'string' && json.pdfBase64.length > 0, 'Missing pdfBase64.');

  if (templateId === 'faang') {
    assert(
      json.latexSource.includes('% template: faang'),
      'Expected FAANG template marker not found. Are you running an old service container?'
    );
  }

  const pdfBuf = decodeBase64ToBuffer(json.pdfBase64);
  assert(pdfBuf.length > 10, 'PDF bytes too small.');
  assert(pdfBuf.subarray(0, 4).toString('utf8') === '%PDF', 'PDF header is not %PDF.');

  console.log('[latex-smoke] OK');
  console.log(`[latex-smoke] latexSource chars: ${json.latexSource.length}`);
  console.log(`[latex-smoke] pdf bytes: ${pdfBuf.length}`);

  if (Array.isArray(json.warnings) && json.warnings.length) {
    console.warn('[latex-smoke] warnings:', json.warnings);
  }

  if (process.env.LATEX_WRITE_OUTPUT === '1') {
    const fs = await import('node:fs/promises');
    const texPath = new URL('./.latex-smoke-output.tex', import.meta.url);
    const pdfPath = new URL('./.latex-smoke-output.pdf', import.meta.url);
    await fs.writeFile(texPath, json.latexSource, 'utf8');
    await fs.writeFile(pdfPath, pdfBuf);
    console.log('[latex-smoke] wrote scripts/.latex-smoke-output.{tex,pdf}');
  }
} catch (err) {
  console.error('[latex-smoke] Failed:', err);
  process.exit(1);
}
