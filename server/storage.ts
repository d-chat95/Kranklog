import { 
  programs, workouts, workoutRows, logs,
  type InsertProgram, type InsertWorkout, type InsertWorkoutRow, type InsertLog,
  type Program, type Workout, type WorkoutRow, type Log,
  type ProgramWithWorkouts, type WorkoutWithRows, type WorkoutRowWithLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<ProgramWithWorkouts | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: number): Promise<boolean>;

  getWorkout(id: number): Promise<WorkoutWithRows | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, data: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;

  createWorkoutRow(row: InsertWorkoutRow): Promise<WorkoutRow>;
  getWorkoutRow(id: number): Promise<WorkoutRow | undefined>;
  updateWorkoutRow(id: number, data: Partial<InsertWorkoutRow>): Promise<WorkoutRow | undefined>;
  deleteWorkoutRow(id: number): Promise<boolean>;

  createLog(log: InsertLog, date?: Date): Promise<Log>;
  getLogs(userId: string, filters?: { workoutRowId?: number, movementFamily?: string, isAnchor?: boolean }): Promise<(Log & { row: WorkoutRow })[]>;
  getLog(id: number): Promise<Log | undefined>;
  updateLog(id: number, data: { weight?: string; reps?: number; rpe?: string | null; notes?: string | null; date?: Date }): Promise<Log | undefined>;
  deleteLog(id: number): Promise<boolean>;

  getLastAnchorLog(userId: string, movementFamily: string, variant?: string): Promise<Log | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: number): Promise<ProgramWithWorkouts | undefined> {
    const program = await db.select().from(programs).where(eq(programs.id, id));
    if (program.length === 0) return undefined;

    const programWorkouts = await db.select().from(workouts)
      .where(eq(workouts.programId, id))
      .orderBy(workouts.workoutDate);

    return { ...program[0], workouts: programWorkouts };
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async updateProgram(id: number, data: Partial<InsertProgram>): Promise<Program | undefined> {
    const [updated] = await db.update(programs).set(data).where(eq(programs.id, id)).returning();
    return updated;
  }

  async deleteProgram(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const programWorkouts = await tx.select({ id: workouts.id }).from(workouts).where(eq(workouts.programId, id));
      if (programWorkouts.length > 0) {
        const workoutIds = programWorkouts.map(w => w.id);
        const rows = await tx.select({ id: workoutRows.id }).from(workoutRows).where(inArray(workoutRows.workoutId, workoutIds));
        if (rows.length > 0) {
          const rowIds = rows.map(r => r.id);
          await tx.delete(logs).where(inArray(logs.workoutRowId, rowIds));
          await tx.delete(workoutRows).where(inArray(workoutRows.id, rowIds));
        }
        await tx.delete(workouts).where(inArray(workouts.id, workoutIds));
      }
      const [deleted] = await tx.delete(programs).where(eq(programs.id, id)).returning();
      return !!deleted;
    });
  }

  async getWorkout(id: number): Promise<WorkoutWithRows | undefined> {
    const workout = await db.select().from(workouts).where(eq(workouts.id, id));
    if (workout.length === 0) return undefined;

    const rows = await db.select().from(workoutRows)
      .where(eq(workoutRows.workoutId, id))
      .orderBy(workoutRows.orderLabel);

    return { ...workout[0], rows };
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  async updateWorkout(id: number, data: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const [updated] = await db.update(workouts).set(data).where(eq(workouts.id, id)).returning();
    return updated;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const rows = await tx.select({ id: workoutRows.id }).from(workoutRows).where(eq(workoutRows.workoutId, id));
      if (rows.length > 0) {
        const rowIds = rows.map(r => r.id);
        await tx.delete(logs).where(inArray(logs.workoutRowId, rowIds));
        await tx.delete(workoutRows).where(inArray(workoutRows.id, rowIds));
      }
      const [deleted] = await tx.delete(workouts).where(eq(workouts.id, id)).returning();
      return !!deleted;
    });
  }

  async createWorkoutRow(row: InsertWorkoutRow): Promise<WorkoutRow> {
    const [newRow] = await db.insert(workoutRows).values(row).returning();
    return newRow;
  }

  async getWorkoutRow(id: number): Promise<WorkoutRow | undefined> {
    const [row] = await db.select().from(workoutRows).where(eq(workoutRows.id, id));
    return row;
  }

  async updateWorkoutRow(id: number, data: Partial<InsertWorkoutRow>): Promise<WorkoutRow | undefined> {
    const [updated] = await db.update(workoutRows).set(data).where(eq(workoutRows.id, id)).returning();
    return updated;
  }

  async deleteWorkoutRow(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      await tx.delete(logs).where(eq(logs.workoutRowId, id));
      const [deleted] = await tx.delete(workoutRows).where(eq(workoutRows.id, id)).returning();
      return !!deleted;
    });
  }

  async createLog(log: InsertLog, date?: Date): Promise<Log> {
    const values = date ? { ...log, date } : log;
    const [newLog] = await db.insert(logs).values(values).returning();
    return newLog;
  }

  async getLogs(userId: string, filters?: { workoutRowId?: number, movementFamily?: string, isAnchor?: boolean }): Promise<(Log & { row: WorkoutRow })[]> {
    const whereConditions = [eq(logs.userId, userId)];

    if (filters?.workoutRowId) {
      whereConditions.push(eq(logs.workoutRowId, filters.workoutRowId));
    }
    
    if (filters?.movementFamily) {
      whereConditions.push(eq(workoutRows.movementFamily, filters.movementFamily as any));
    }

    if (filters?.isAnchor !== undefined) {
      whereConditions.push(eq(workoutRows.isAnchor, filters.isAnchor));
    }

    const results = await db.select({
      log: logs,
      row: workoutRows
    })
    .from(logs)
    .innerJoin(workoutRows, eq(logs.workoutRowId, workoutRows.id))
    .where(and(...whereConditions))
    .orderBy(desc(logs.date));

    return results.map(r => ({ ...r.log, row: r.row }));
  }

  async getLog(id: number): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.id, id));
    return log;
  }

  async updateLog(id: number, data: { weight?: string; reps?: number; rpe?: string | null; notes?: string | null; date?: Date }): Promise<Log | undefined> {
    const [updated] = await db.update(logs).set(data).where(eq(logs.id, id)).returning();
    return updated;
  }

  async deleteLog(id: number): Promise<boolean> {
    const [deleted] = await db.delete(logs).where(eq(logs.id, id)).returning();
    return !!deleted;
  }

  async getLastAnchorLog(userId: string, movementFamily: string, variant?: string): Promise<Log | undefined> {
    let query = db.select({
      log: logs
    })
    .from(logs)
    .innerJoin(workoutRows, eq(logs.workoutRowId, workoutRows.id))
    .where(and(
      eq(logs.userId, userId),
      eq(workoutRows.movementFamily, movementFamily as any),
      eq(workoutRows.isAnchor, true)
    ))
    .orderBy(desc(logs.date))
    .limit(1);

    const [result] = await query;
    return result?.log;
  }
}

export const storage = new DatabaseStorage();
