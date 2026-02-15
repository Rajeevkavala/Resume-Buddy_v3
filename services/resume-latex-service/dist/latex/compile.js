import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// First run of tectonic may download bundles/formats, which can take >25s.
// Use a higher default to avoid flaky timeouts in cold-start scenarios.
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5MB
function truncate(s, max = 16_000) {
    if (s.length <= max)
        return s;
    return s.slice(0, max) + '\n...[truncated]';
}
export async function compileWithTectonic(latexSource, opts) {
    const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const dir = await mkdtemp(join(tmpdir(), 'resume-latex-'));
    const texPath = join(dir, 'main.tex');
    const pdfPath = join(dir, 'main.pdf');
    try {
        await writeFile(texPath, latexSource, 'utf8');
        const { code, stdout, stderr, timedOut, spawnError } = await new Promise((resolve) => {
            let child;
            try {
                child = spawn('tectonic', ['--outdir', dir, 'main.tex'], {
                    cwd: dir,
                    env: { ...process.env },
                });
            }
            catch (e) {
                // Synchronous spawn failures (rare) should still be handled.
                resolve({ code: null, stdout: '', stderr: '', timedOut: false, spawnError: e });
                return;
            }
            let out = '';
            let err = '';
            if (child.stdout) {
                child.stdout.setEncoding('utf8');
                child.stdout.on('data', (d) => (out += d));
            }
            if (child.stderr) {
                child.stderr.setEncoding('utf8');
                child.stderr.on('data', (d) => (err += d));
            }
            let didTimeout = false;
            const timer = setTimeout(() => {
                // Best-effort kill.
                didTimeout = true;
                child?.kill('SIGKILL');
            }, timeoutMs);
            // Critical on Windows: ENOENT (missing binary) emits an 'error' event and
            // will crash the process if unhandled.
            child.on('error', (e) => {
                clearTimeout(timer);
                resolve({ code: null, stdout: truncate(out), stderr: truncate(err), timedOut: false, spawnError: e });
            });
            child.on('close', (c) => {
                clearTimeout(timer);
                resolve({ code: c, stdout: truncate(out), stderr: truncate(err), timedOut: didTimeout });
            });
        });
        if (spawnError) {
            const e = spawnError;
            const code = typeof e?.code === 'string' ? e.code : undefined;
            const err = new Error(code === 'ENOENT'
                ? 'tectonic binary not found on PATH. Install tectonic or run this service via Docker.'
                : 'Failed to spawn tectonic');
            err.code = code === 'ENOENT' ? 'TECTONIC_NOT_FOUND' : 'TECTONIC_SPAWN_FAILED';
            err.details = {
                code,
                message: e?.message,
            };
            throw err;
        }
        if (timedOut) {
            const err = new Error(`tectonic timed out after ${timeoutMs}ms`);
            err.code = 'TIMEOUT';
            throw err;
        }
        if (code !== 0) {
            const details = [
                `tectonic exited with code ${code}`,
                stdout ? `stdout:\n${stdout}` : '',
                stderr ? `stderr:\n${stderr}` : '',
            ]
                .filter(Boolean)
                .join('\n\n');
            const err = new Error(details);
            err.code = 'TECTONIC_FAILED';
            throw err;
        }
        const pdfBytes = await readFile(pdfPath);
        if (pdfBytes.length === 0) {
            const err = new Error('tectonic produced an empty PDF');
            err.code = 'EMPTY_PDF';
            throw err;
        }
        if (pdfBytes.length > MAX_PDF_BYTES) {
            const err = new Error(`PDF too large (${pdfBytes.length} bytes)`);
            err.code = 'PDF_TOO_LARGE';
            throw err;
        }
        // Basic PDF sanity check.
        if (pdfBytes.subarray(0, 4).toString('utf8') !== '%PDF') {
            const err = new Error('Output is not a valid PDF');
            err.code = 'INVALID_PDF';
            throw err;
        }
        return { pdfBytes, stdout, stderr };
    }
    finally {
        // Always clean temp dir.
        try {
            await rm(dir, { recursive: true, force: true });
        }
        catch {
            // ignore
        }
    }
}
