import { z } from 'zod';
import { insertScoreSchema, glaciers, scores } from './schema';

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
        404: z.object({ message: z.string() }),
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
      input: insertScoreSchema,
      responses: {
        201: z.custom<typeof scores.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
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
