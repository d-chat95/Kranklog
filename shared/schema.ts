import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum, index } from "drizzle-orm/pg-core";
import { relations, desc } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Import auth models - CRITICAL for Replit Auth
export * from "./models/auth";
import { users } from "./models/auth";

// Enums
export const movementFamilyEnum = pgEnum("movement_family", [
  "Bench",
  "Deadlift",
  "Squat",
  "Row",
  "Carry",
  "Conditioning",
  "Accessory"
]);

export const intensityTypeEnum = pgEnum("intensity_type", [
  "RPE",
  "%1RM",
  "MAX",
  "Text"
]);

// Programs
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workouts
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => programs.id),
  name: text("name").notNull(), // e.g., "Week 1 Day 1"
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
});

// Workout Rows (The prescribed workout)
export const workoutRows = pgTable("workout_rows", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workouts.id),
  orderLabel: text("order_label").notNull(), // 1a, 1b, 2...
  liftName: text("lift_name").notNull(),
  variant: text("variant"), // e.g., "Pause -15%"
  sets: text("sets").notNull(), // Text to allow "4-5" or "AMRAP" if needed, but usually numbers
  reps: text("reps").notNull(),
  intensityValue: text("intensity_value"), // "6", "75", "MAX"
  intensityType: intensityTypeEnum("intensity_type").default("RPE"),
  rest: text("rest"),
  isAnchor: boolean("is_anchor").default(false),
  movementFamily: movementFamilyEnum("movement_family").default("Accessory"),
}, (table) => {
  return {
    workoutIdOrderLabelIdx: index("workout_rows_workout_id_order_label_idx").on(table.workoutId, table.orderLabel),
  };
});

// Logs (Actual execution)
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // Using text because users.id is varchar from auth schema
  workoutRowId: integer("workout_row_id").notNull().references(() => workoutRows.id),
  weight: numeric("weight"), // Actual weight lifted
  reps: integer("reps"), // Actual reps performed
  rpe: numeric("rpe"), // Actual RPE
  notes: text("notes"),
  date: timestamp("date").defaultNow(),
}, (table) => {
  return {
    userIdDateIdx: index("logs_user_id_date_idx").on(table.userId, table.date.desc()),
    workoutRowIdDateIdx: index("logs_workout_row_id_date_idx").on(table.workoutRowId, table.date.desc()),
  };
});

// Relations
export const programsRelations = relations(programs, ({ many }) => ({
  workouts: many(workouts),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  program: one(programs, {
    fields: [workouts.programId],
    references: [programs.id],
  }),
  rows: many(workoutRows),
}));

export const workoutRowsRelations = relations(workoutRows, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutRows.workoutId],
    references: [workouts.id],
  }),
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  user: one(users, {
    fields: [logs.userId],
    references: [users.id],
  }),
  row: one(workoutRows, {
    fields: [logs.workoutRowId],
    references: [workoutRows.id],
  }),
}));

// Schemas
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true });
export const insertWorkoutRowSchema = createInsertSchema(workoutRows).omit({ id: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, date: true });

// Types
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type WorkoutRow = typeof workoutRows.$inferSelect;
export type InsertWorkoutRow = z.infer<typeof insertWorkoutRowSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

// Request Types
export type CreateProgramRequest = InsertProgram;
export type CreateWorkoutRequest = InsertWorkout;
export type CreateWorkoutRowRequest = InsertWorkoutRow;
export type CreateLogRequest = InsertLog;

// Responses
export type ProgramWithWorkouts = Program & { workouts: Workout[] };
export type WorkoutWithRows = Workout & { rows: WorkoutRow[] };
export type WorkoutRowWithLogs = WorkoutRow & { logs: Log[] }; // For history or current session view
