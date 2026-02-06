import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { programs, workouts, workoutRows } from "@shared/schema"; // For seeding
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Programs
  app.get(api.programs.list.path, isAuthenticated, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, isAuthenticated, async (req, res) => {
    const program = await storage.getProgram(Number(req.params.id));
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.json(program);
  });

  app.post(api.programs.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.programs.create.input.parse(req.body);
      const program = await storage.createProgram(input);
      res.status(201).json(program);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Workouts
  app.get(api.workouts.get.path, isAuthenticated, async (req, res) => {
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  });

  app.post(api.workouts.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.workouts.create.input.parse(req.body);
      const workout = await storage.createWorkout(input);
      res.status(201).json(workout);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Workout Rows
  app.post(api.workoutRows.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.workoutRows.create.input.parse(req.body);
      const row = await storage.createWorkoutRow(input);
      res.status(201).json(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Logs
  app.post(api.logs.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.logs.create.input.parse(req.body);
      // Ensure user ID matches authenticated user
      if (input.userId !== (req.user as any).claims.sub) {
        return res.status(403).json({ message: "Cannot log for another user" });
      }
      const log = await storage.createLog(input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.logs.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { workoutRowId, movementFamily, isAnchor } = req.query;
    
    const logs = await storage.getLogs(userId, {
      workoutRowId: workoutRowId ? Number(workoutRowId) : undefined,
      movementFamily: movementFamily as string,
      isAnchor: isAnchor === "true"
    });
    res.json(logs);
  });

  // Stats & Suggestions
  app.get(api.stats.e1rm.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { movementFamily } = req.query;
    if (!movementFamily) return res.status(400).json({ message: "Movement family required" });

    // Get anchor logs for this family
    const logs = await storage.getLogs(userId, { 
      movementFamily: movementFamily as string,
      isAnchor: true 
    });

    // Calculate e1RM for each log
    const stats = logs.map(l => {
      // E1RM Formula: Weight * (1 + (0.0333 * Reps) + (10 - RPE) * 0.0333) ??
      // Let's use simpler: Weight * (1 + 0.0333 * Reps) / (IntensityFromRPE)
      // Or just: Weight * (1 + 0.0333 * Reps). RPE adjustment adds complexity. 
      // User requirements: "estimated an e1RM from weight+reps+RPE"
      // Let's use: (Weight * Reps * 0.0333 + Weight) matches standard.
      // Adjust for RPE: "effective reps" = Reps + (10 - RPE).
      // So: Weight * (1 + 0.0333 * (Reps + (10 - Number(l.rpe || 10))))
      
      const rpe = Number(l.rpe) || 10;
      const reps = l.reps || 1;
      const weight = Number(l.weight) || 0;
      
      const effectiveReps = reps + (10 - rpe);
      const e1rm = weight * (1 + 0.0333 * effectiveReps);

      return {
        date: l.date?.toISOString() || "",
        e1rm: Math.round(e1rm),
        weight,
        reps,
        rpe
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(stats);
  });

  app.get(api.stats.suggestions.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { movementFamily } = req.query;
    if (!movementFamily) return res.status(400).json({ message: "Movement family required" });

    const lastLog = await storage.getLastAnchorLog(userId, movementFamily as string);
    
    if (!lastLog) {
      return res.json({ suggestion1x3: null, suggestion1x5: null });
    }

    const rpe = Number(lastLog.rpe) || 10;
    const reps = lastLog.reps || 1;
    const weight = Number(lastLog.weight) || 0;
    const effectiveReps = reps + (10 - rpe);
    const e1rm = weight * (1 + 0.0333 * effectiveReps);

    // Targets @ 6 RPE
    // 1x3 @ 6 RPE -> Effective reps = 3 + (10-6) = 7. 
    // Weight = E1RM / (1 + 0.0333 * 7)
    const factor3 = 1 + 0.0333 * 7;
    const suggestion1x3 = Math.round((e1rm / factor3) * 10) / 10; // Round to 1 decimal place

    // 1x5 @ 6 RPE -> Effective reps = 5 + (10-6) = 9.
    const factor5 = 1 + 0.0333 * 9;
    const suggestion1x5 = Math.round((e1rm / factor5) * 10) / 10;

    res.json({
      suggestion1x3,
      suggestion1x5
    });
  });

  // SEED DATA
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingPrograms = await storage.getPrograms();
  if (existingPrograms.length > 0) return;

  console.log("Seeding database...");
  
  const program = await storage.createProgram({
    name: "Krank 6-Week Strength",
    description: "Focus on Squat, Bench, Deadlift anchors."
  });

  const workout1 = await storage.createWorkout({
    programId: program.id,
    name: "Week 1 - Lower Body",
    orderIndex: 1,
    description: "Deadlift focus"
  });

  await storage.createWorkoutRow({
    workoutId: workout1.id,
    orderLabel: "1a",
    liftName: "Deadlift",
    sets: "1",
    reps: "3",
    intensityValue: "6",
    intensityType: "RPE",
    rest: "3-5 min",
    isAnchor: true,
    movementFamily: "Deadlift"
  });

  await storage.createWorkoutRow({
    workoutId: workout1.id,
    orderLabel: "1b",
    liftName: "Pause Deadlift",
    variant: "-15%",
    sets: "4",
    reps: "4",
    intensityValue: "4",
    intensityType: "RPE", // Or derived from 1a
    rest: "1 min",
    movementFamily: "Deadlift"
  });

  const workout2 = await storage.createWorkout({
    programId: program.id,
    name: "Week 1 - Upper Body",
    orderIndex: 2,
    description: "Bench focus"
  });

  await storage.createWorkoutRow({
    workoutId: workout2.id,
    orderLabel: "2a",
    liftName: "Bench Press",
    sets: "1",
    reps: "5",
    intensityValue: "6",
    intensityType: "RPE",
    rest: "3 min",
    isAnchor: true,
    movementFamily: "Bench"
  });

  await storage.createWorkoutRow({
    workoutId: workout2.id,
    orderLabel: "2b",
    liftName: "Larsen Press",
    variant: "-12%",
    sets: "4",
    reps: "6",
    rest: "1 min",
    movementFamily: "Bench"
  });

  console.log("Database seeded!");
}
