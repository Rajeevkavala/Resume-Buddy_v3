import { z } from 'zod';

export const compileOptionsSchema = z
  .object({
    engine: z.literal('tectonic'),
    return: z
      .array(z.enum(['latex', 'pdf']))
      .min(1)
      .refine((vals) => vals.includes('latex') && vals.includes('pdf'), {
        message: "options.return must include both 'latex' and 'pdf' for MVP",
      }),
    fileBaseName: z.string().min(1).optional(),
  })
  .strict();

export const compileRequestSchema = z
  .object({
    source: z.enum(['resumeData', 'resumeText']),
    templateId: z.string().min(1),
    resumeData: z.unknown().optional(),
    resumeText: z.string().optional(),
    options: compileOptionsSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.source === 'resumeData' && val.resumeData === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['resumeData'],
        message: 'resumeData is required when source=resumeData',
      });
    }

    if (val.source === 'resumeText') {
      if (typeof val.resumeText !== 'string' || val.resumeText.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resumeText'],
          message: 'resumeText is required when source=resumeText',
        });
      }
    }
  });

// Aliases used by the route implementation
export const latexCompileRequestSchema = compileRequestSchema;

export const compileSuccessResponseSchema = z
  .object({
    ok: z.literal(true),
    latexSource: z.string(),
    pdfBase64: z.string(),
  })
  .strict();

export const latexCompileSuccessResponseSchema = compileSuccessResponseSchema;

export const compileErrorResponseSchema = z
  .object({
    ok: z.literal(false),
    error: z.enum(['INVALID_REQUEST', 'COMPILE_FAILED', 'INTERNAL_ERROR']),
    message: z.string(),
    details: z.unknown().optional(),
  })
  .strict();

export const latexCompileErrorResponseSchema = compileErrorResponseSchema;

export type CompileRequest = z.infer<typeof compileRequestSchema>;
