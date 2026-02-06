import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { programs, workouts, workoutRows } from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  // ─── Programs ───────────────────────────────────────
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

  app.patch(api.programs.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.programs.update.input.parse(req.body);
      const updated = await storage.updateProgram(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Program not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.programs.delete.path, isAuthenticated, async (req, res) => {
    const deleted = await storage.deleteProgram(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Program not found" });
    res.json({ ok: true });
  });

  // ─── Workouts ───────────────────────────────────────
  app.get(api.workouts.get.path, isAuthenticated, async (req, res) => {
    const workout = await storage.getWorkout(Number(req.params.id));
    if (!workout) return res.status(404).json({ message: "Workout not found" });
    res.json(workout);
  });

  app.post(api.workouts.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.workouts.create.input.parse(req.body);
      const { workoutDate, ...rest } = input;
      let parsedDate = new Date();
      if (workoutDate) {
        parsedDate = new Date(workoutDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid workout date" });
        }
      }
      const workout = await storage.createWorkout({ ...rest, workoutDate: parsedDate });
      res.status(201).json(workout);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.workouts.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.workouts.update.input.parse(req.body);
      const { workoutDate, ...rest } = input;
      const updateData: any = { ...rest };
      if (workoutDate) {
        const parsedDate = new Date(workoutDate);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({ message: "Invalid workout date" });
        }
        updateData.workoutDate = parsedDate;
      }
      const updated = await storage.updateWorkout(Number(req.params.id), updateData);
      if (!updated) return res.status(404).json({ message: "Workout not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.workouts.delete.path, isAuthenticated, async (req, res) => {
    const deleted = await storage.deleteWorkout(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Workout not found" });
    res.json({ ok: true });
  });

  // ─── Workout Rows ──────────────────────────────────
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

  app.patch(api.workoutRows.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.workoutRows.update.input.parse(req.body);
      const updated = await storage.updateWorkoutRow(Number(req.params.id), input);
      if (!updated) return res.status(404).json({ message: "Workout row not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.workoutRows.delete.path, isAuthenticated, async (req, res) => {
    const deleted = await storage.deleteWorkoutRow(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Workout row not found" });
    res.json({ ok: true });
  });

  // ─── Logs ──────────────────────────────────────────
  app.post(api.logs.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.logs.create.input.parse(req.body);
      if (input.userId !== (req.user as any).claims.sub) {
        return res.status(403).json({ message: "Cannot log for another user" });
      }
      const { date: dateStr, ...logData } = input;
      const performedAt = dateStr ? new Date(dateStr) : new Date();
      const log = await storage.createLog(logData, performedAt);
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
      isAnchor: typeof isAnchor === "string" ? isAnchor === "true" : undefined
    });
    res.json(logs);
  });

  app.patch(api.logs.update.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const logId = Number(req.params.id);
      const existing = await storage.getLog(logId);
      if (!existing) return res.status(404).json({ message: "Log not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Not your log" });

      const input = api.logs.update.input.parse(req.body);
      const updateData: any = {};
      if (input.weight !== undefined) updateData.weight = input.weight;
      if (input.reps !== undefined) updateData.reps = input.reps;
      if (input.rpe !== undefined) updateData.rpe = input.rpe;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.date !== undefined) updateData.date = new Date(input.date);

      const updated = await storage.updateLog(logId, updateData);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.logs.delete.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const logId = Number(req.params.id);
    const existing = await storage.getLog(logId);
    if (!existing) return res.status(404).json({ message: "Log not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Not your log" });

    const deleted = await storage.deleteLog(logId);
    if (!deleted) return res.status(404).json({ message: "Log not found" });
    res.json({ ok: true });
  });

  // ─── Stats & Suggestions ──────────────────────────
  app.get(api.stats.e1rm.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const { movementFamily } = req.query;
    if (!movementFamily) return res.status(400).json({ message: "Movement family required" });

    const logs = await storage.getLogs(userId, { 
      movementFamily: movementFamily as string,
      isAnchor: true 
    });

    const stats = logs.map(l => {
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

    const factor3 = 1 + 0.0333 * 7;
    const suggestion1x3 = Math.round((e1rm / factor3) * 10) / 10;

    const factor5 = 1 + 0.0333 * 9;
    const suggestion1x5 = Math.round((e1rm / factor5) * 10) / 10;

    res.json({
      suggestion1x3,
      suggestion1x5
    });
  });

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
    intensityType: "RPE",
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
