import { 
  programs, workouts, workoutRows, logs,
  type InsertProgram, type InsertWorkout, type InsertWorkoutRow, type InsertLog,
  type Program, type Workout, type WorkoutRow, type Log,
  type ProgramWithWorkouts, type WorkoutWithRows, type WorkoutRowWithLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Programs
  getPrograms(): Promise<Program[]>;
  getProgram(id: number): Promise<ProgramWithWorkouts | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;

  // Workouts
  getWorkout(id: number): Promise<WorkoutWithRows | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;

  // Workout Rows
  createWorkoutRow(row: InsertWorkoutRow): Promise<WorkoutRow>;
  getWorkoutRow(id: number): Promise<WorkoutRow | undefined>;
  
  // Logs
  createLog(log: InsertLog): Promise<Log>;
  getLogs(userId: string, filters?: { workoutRowId?: number, movementFamily?: string, isAnchor?: boolean }): Promise<(Log & { row: WorkoutRow })[]>;
  
  // Stats helpers
  getLastAnchorLog(userId: string, movementFamily: string, variant?: string): Promise<Log | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Programs
  async getPrograms(): Promise<Program[]> {
    return await db.select().from(programs).orderBy(desc(programs.createdAt));
  }

  async getProgram(id: number): Promise<ProgramWithWorkouts | undefined> {
    const program = await db.select().from(programs).where(eq(programs.id, id));
    if (program.length === 0) return undefined;

    const programWorkouts = await db.select().from(workouts)
      .where(eq(workouts.programId, id))
      .orderBy(workouts.orderIndex);

    return { ...program[0], workouts: programWorkouts };
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  // Workouts
  async getWorkout(id: number): Promise<WorkoutWithRows | undefined> {
    const workout = await db.select().from(workouts).where(eq(workouts.id, id));
    if (workout.length === 0) return undefined;

    const rows = await db.select().from(workoutRows)
      .where(eq(workoutRows.workoutId, id))
      .orderBy(workoutRows.orderLabel); // Should ideally sort alphanumerically 1a, 1b...

    return { ...workout[0], rows };
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newWorkout] = await db.insert(workouts).values(workout).returning();
    return newWorkout;
  }

  // Workout Rows
  async createWorkoutRow(row: InsertWorkoutRow): Promise<WorkoutRow> {
    const [newRow] = await db.insert(workoutRows).values(row).returning();
    return newRow;
  }

  async getWorkoutRow(id: number): Promise<WorkoutRow | undefined> {
    const [row] = await db.select().from(workoutRows).where(eq(workoutRows.id, id));
    return row;
  }

  // Logs
  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(log).returning();
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

  async getLastAnchorLog(userId: string, movementFamily: string, variant?: string): Promise<Log | undefined> {
    // Find the most recent log for an anchor set of this movement family
    // Optionally filter by variant text if provided (fuzzy match or exact? Let's do exact or skip for MVP simplicty)
    // For "Bench" we just want the last heavy Bench anchor.
    
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
