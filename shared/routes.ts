import { z } from 'zod';
import { glaciers, scores } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  glaciers: {
    list: {
      method: 'GET' as const,
      path: '/api/glaciers',
      responses: {
        200: z.array(z.custom<typeof glaciers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/glaciers/:id',
      responses: {
        200: z.custom<typeof glaciers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  scores: {
    list: {
      method: 'GET' as const,
      path: '/api/scores',
      responses: {
        200: z.array(z.custom<typeof scores.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/scores',
      input: z.object({
        glacierName: z.string(),
        yearsSurvived: z.number(),
        finalIceVolume: z.number(),
        finalStability: z.number(),
        finalThickness: z.number(),
        score: z.number(),
      }),
      responses: {
        201: z.custom<typeof scores.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  ai: {
    predict: {
      method: 'POST' as const,
      path: '/api/predict',
      input: z.object({
        glacierName: z.string(),
        stats: z.object({
          thickness: z.number(),
          stability: z.number(),
          volume: z.number(),
        }),
        environment: z.object({
          globalTemp: z.number(),
          snowfall: z.number(),
          emissions: z.number(),
          oceanTemp: z.number(),
        }),
      }),
      responses: {
        200: z.object({ prediction: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Type Helpers
export type ScoreInput = z.infer<typeof api.scores.create.input>;
export type ScoreResponse = z.infer<typeof api.scores.create.responses[201]>;
export type GlaciersListResponse = z.infer<typeof api.glaciers.list.responses[200]>;
export type PredictInput = z.infer<typeof api.ai.predict.input>;
export type PredictResponse = z.infer<typeof api.ai.predict.responses[200]>;
