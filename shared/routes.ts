import { z } from 'zod';
import { 
  insertProgramSchema, 
  insertWorkoutSchema, 
  insertWorkoutRowSchema, 
  insertLogSchema,
  programs, 
  workouts, 
  workoutRows, 
  logs 
} from './schema';

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

export const api = {
  programs: {
    list: {
      method: 'GET' as const,
      path: '/api/programs',
      responses: {
        200: z.array(z.custom<typeof programs.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/programs/:id',
      responses: {
        200: z.custom<typeof programs.$inferSelect & { workouts: typeof workouts.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/programs',
      input: insertProgramSchema,
      responses: {
        201: z.custom<typeof programs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  workouts: {
    get: {
      method: 'GET' as const,
      path: '/api/workouts/:id',
      responses: {
        200: z.custom<typeof workouts.$inferSelect & { rows: typeof workoutRows.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workouts',
      input: insertWorkoutSchema,
      responses: {
        201: z.custom<typeof workouts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  workoutRows: {
    create: {
      method: 'POST' as const,
      path: '/api/workout-rows',
      input: insertWorkoutRowSchema,
      responses: {
        201: z.custom<typeof workoutRows.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  logs: {
    create: {
      method: 'POST' as const,
      path: '/api/logs',
      input: insertLogSchema.extend({ date: z.string().optional() }),
      responses: {
        201: z.custom<typeof logs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/logs', // Query params: userId, rowId, movementFamily
      input: z.object({
        workoutRowId: z.string().optional(),
        movementFamily: z.string().optional(),
        isAnchor: z.string().optional(), // "true" or "false"
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect & { row: typeof workoutRows.$inferSelect }>()),
      },
    }
  },
  stats: {
    e1rm: {
      method: 'GET' as const,
      path: '/api/stats/e1rm',
      input: z.object({
        movementFamily: z.string(),
        variant: z.string().optional(),
      }),
      responses: {
        200: z.array(z.object({
          date: z.string(),
          e1rm: z.number(),
          weight: z.number(),
          reps: z.number(),
          rpe: z.number(),
        })),
      },
    },
    suggestions: {
      method: 'GET' as const,
      path: '/api/stats/suggestions',
      input: z.object({
        movementFamily: z.string(),
      }),
      responses: {
        200: z.object({
          suggestion1x3: z.number().nullable(),
          suggestion1x5: z.number().nullable(),
        }),
      },
    }
  }
};

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
