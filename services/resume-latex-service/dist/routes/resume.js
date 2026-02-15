import { latexCompileRequestSchema, latexCompileSuccessResponseSchema, } from '../schemas.js';
import { serializeToLatex } from '../latex/serialize.js';
import { compileWithTectonic } from '../latex/compile.js';
function toErrorResponse(params) {
    return {
        ok: false,
        error: params.error,
        message: params.message,
        details: params.details,
    };
}
export async function registerResumeRoutes(app) {
    app.post('/v1/resume/latex/compile', async (request, reply) => {
        const parsed = latexCompileRequestSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send(toErrorResponse({
                error: 'INVALID_REQUEST',
                message: 'Invalid request body',
                details: parsed.error.flatten(),
            }));
        }
        const input = parsed.data;
        try {
            const { latexSource } = serializeToLatex(input);
            const { pdfBytes } = await compileWithTectonic(latexSource);
            const response = {
                ok: true,
                latexSource,
                pdfBase64: pdfBytes.toString('base64'),
            };
            // Defensive: ensure response matches contract.
            const validated = latexCompileSuccessResponseSchema.parse(response);
            return reply.status(200).send(validated);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            // Handle known compile failures.
            const code = err?.code;
            if (code === 'TECTONIC_FAILED' ||
                code === 'TECTONIC_NOT_FOUND' ||
                code === 'TECTONIC_SPAWN_FAILED' ||
                code === 'EMPTY_PDF' ||
                code === 'INVALID_PDF' ||
                code === 'PDF_TOO_LARGE' ||
                code === 'TIMEOUT') {
                return reply.status(422).send(toErrorResponse({
                    error: 'COMPILE_FAILED',
                    message: 'LaTeX compilation failed',
                    details: {
                        code,
                        error: message,
                    },
                }));
            }
            request.log.error({ err }, 'latex compile failed');
            return reply.status(500).send(toErrorResponse({
                error: 'INTERNAL_ERROR',
                message: 'Internal error',
            }));
        }
    });
}
