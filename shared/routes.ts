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

const okResponse = z.object({ ok: z.literal(true) });

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
    update: {
      method: 'PATCH' as const,
      path: '/api/programs/:id',
      input: insertProgramSchema.partial(),
      responses: {
        200: z.custom<typeof programs.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/programs/:id',
      responses: {
        200: okResponse,
        404: errorSchemas.notFound,
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
      input: insertWorkoutSchema.extend({ workoutDate: z.string().optional() }),
      responses: {
        201: z.custom<typeof workouts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/workouts/:id',
      input: insertWorkoutSchema.partial().extend({ workoutDate: z.string().optional() }),
      responses: {
        200: z.custom<typeof workouts.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/workouts/:id',
      responses: {
        200: okResponse,
        404: errorSchemas.notFound,
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
    update: {
      method: 'PATCH' as const,
      path: '/api/workout-rows/:id',
      input: insertWorkoutRowSchema.partial(),
      responses: {
        200: z.custom<typeof workoutRows.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/workout-rows/:id',
      responses: {
        200: okResponse,
        404: errorSchemas.notFound,
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
      path: '/api/logs',
      input: z.object({
        workoutRowId: z.string().optional(),
        movementFamily: z.string().optional(),
        isAnchor: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect & { row: typeof workoutRows.$inferSelect }>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/logs/:id',
      input: z.object({
        weight: z.string().optional(),
        reps: z.number().optional(),
        rpe: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
        date: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof logs.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/logs/:id',
      responses: {
        200: okResponse,
        404: errorSchemas.notFound,
      },
    },
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
