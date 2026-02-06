import { Layout } from "@/components/Layout";
import { useWorkout, useCreateWorkoutRow, useUpdateWorkout, useDeleteWorkout, useUpdateWorkoutRow, useDeleteWorkoutRow, useCompleteWorkout } from "@/hooks/use-workouts";
import { useCreateLog, useLogs, useUpdateLog, useDeleteLog } from "@/hooks/use-logs";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient, useQueries } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, Plus, CheckCircle2, History, Anchor, CalendarDays, Pencil, Trash2, MoreVertical, Flag, TrendingUp, Target, AlertTriangle, BarChart3, ClipboardList } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { movementFamilyEnum, intensityTypeEnum } from "@shared/schema";
import type { WorkoutRow, Log } from "@shared/schema";
import { format } from "date-fns";

const rowSchema = z.object({
  orderLabel: z.string().min(1, "Order is required (e.g. 1a)"),
  liftName: z.string().min(1, "Lift name is required"),
  variant: z.string().optional(),
  sets: z.string().min(1, "Sets required"),
  reps: z.string().min(1, "Reps required"),
  intensityValue: z.string().optional(),
  intensityType: z.enum(["RPE", "%1RM", "MAX", "Text"]),
  rest: z.string().optional(),
  isAnchor: z.boolean().default(false),
  movementFamily: z.enum(["Bench", "Deadlift", "Squat", "Row", "Carry", "Conditioning", "Accessory"]),
});

export default function WorkoutSession() {
  const [, params] = useRoute("/workouts/:id");
  const workoutId = parseInt(params?.id || "0");
  const { data: workout, isLoading } = useWorkout(workoutId);
  const [sessionDate, setSessionDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [editingWorkout, setEditingWorkout] = useState(false);
  const [deletingWorkout, setDeletingWorkout] = useState(false);
  const [, navigate] = useLocation();
  const { mutate: completeWorkout, isPending: isCompleting } = useCompleteWorkout();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"report" | "exercises">("report");
  
  if (isLoading) return <Layout><LoadingSpinner /></Layout>;
  if (!workout) return <Layout><div className="p-8 text-center">Workout not found</div></Layout>;

  const isToday = sessionDate === format(new Date(), "yyyy-MM-dd");
  const isCompleted = !!workout.completedAt;
  const showReport = isCompleted && viewMode === "report";

  const handleFinishWorkout = () => {
    completeWorkout({ id: workoutId }, {
      onSuccess: () => {
        toast({ title: "Workout Complete", description: "Great session! Your data has been saved." });
        setViewMode("report");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <Layout
      header={
        <div className="space-y-4">
          <Link href={`/programs/${workout.programId}`} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Program
          </Link>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground uppercase" data-testid="text-workout-title">{workout.name}</h1>
                {isCompleted && (
                  <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-primary/20" data-testid="badge-completed">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
              {workout.workoutDate && (
                <p className="text-sm text-primary font-semibold mt-1" data-testid="text-workout-date">
                  {format(new Date(workout.workoutDate), "EEEE, MMM d, yyyy")}
                </p>
              )}
              <p className="text-muted-foreground">{workout.description}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isCompleted && (
                <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5" data-testid="toggle-view-mode">
                  <button
                    onClick={() => setViewMode("report")}
                    className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1 ${
                      viewMode === "report" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover-elevate"
                    }`}
                    data-testid="button-view-report"
                  >
                    <BarChart3 className="w-3 h-3" /> Report
                  </button>
                  <button
                    onClick={() => setViewMode("exercises")}
                    className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors flex items-center gap-1 ${
                      viewMode === "exercises" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover-elevate"
                    }`}
                    data-testid="button-view-exercises"
                  >
                    <ClipboardList className="w-3 h-3" /> Exercises
                  </button>
                </div>
              )}
              {!showReport && (
                <>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-xs uppercase text-muted-foreground sr-only">Session Date</Label>
                    <Input
                      type="date"
                      value={sessionDate}
                      onChange={e => setSessionDate(e.target.value)}
                      className="bg-card border-border w-[160px]"
                      data-testid="input-session-date"
                    />
                  </div>
                  {!isToday && (
                    <span className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">Backfill</span>
                  )}
                  <AddExerciseDialog workoutId={workoutId} />
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" data-testid="button-workout-actions">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingWorkout(true)} data-testid="button-edit-workout">
                    <Pencil className="w-4 h-4 mr-2" /> Edit Workout
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeletingWorkout(true)} className="text-destructive" data-testid="button-delete-workout">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Workout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      }
    >
      {showReport ? (
        <WorkoutReport workout={workout} onEditLogs={() => setViewMode("exercises")} />
      ) : (
        <div className="space-y-6 pb-20">
          {isCompleted && (
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-md" data-testid="banner-completed">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Workout completed</p>
                <p className="text-xs text-muted-foreground">
                  Finished {format(new Date(workout.completedAt!), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}

          {workout.rows?.length === 0 && (
            <div className="text-center py-20 bg-card/50 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground mb-4">No exercises in this workout.</p>
              <AddExerciseDialog workoutId={workoutId} triggerText="Add First Exercise" />
            </div>
          )}

          {workout.rows?.sort((a,b) => a.orderLabel.localeCompare(b.orderLabel)).map((row) => (
            <ExerciseRowCard key={row.id} row={row} sessionDate={sessionDate} workoutId={workoutId} />
          ))}

          {!isCompleted && workout.rows && workout.rows.length > 0 && (
            <div className="pt-4 border-t border-border">
              <Button
                onClick={handleFinishWorkout}
                disabled={isCompleting}
                variant="default"
                className="w-full h-14 text-lg font-bold uppercase tracking-widest"
                data-testid="button-finish-workout"
              >
                {isCompleting ? (
                  "Completing..."
                ) : (
                  <><Flag className="w-5 h-5 mr-2" /> Finish Workout</>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {editingWorkout && (
        <EditWorkoutDialog
          workout={workout}
          open={editingWorkout}
          onOpenChange={setEditingWorkout}
        />
      )}

      <DeleteWorkoutConfirm
        open={deletingWorkout}
        onOpenChange={setDeletingWorkout}
        workoutId={workoutId}
        programId={workout.programId}
        onDeleted={() => navigate(`/programs/${workout.programId}`)}
      />
    </Layout>
  );
}

type LogWithRow = Log & { row: WorkoutRow };

function computeE1RM(weight: number, reps: number, rpe: number): number {
  const effectiveReps = reps + (10 - rpe);
  return weight * (1 + 0.0333 * effectiveReps);
}

function WorkoutReport({ workout, onEditLogs }: { workout: any; onEditLogs: () => void }) {
  const rows: WorkoutRow[] = workout.rows || [];
  const rowIds = rows.map(r => r.id);

  const logQueries = useQueries({
    queries: rowIds.map(id => ({
      queryKey: [api.logs.list.path, JSON.stringify({ workoutRowId: id.toString() })],
      queryFn: async () => {
        const url = new URL(api.logs.list.path, window.location.origin);
        url.searchParams.append("workoutRowId", id.toString());
        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch logs");
        return api.logs.list.responses[200].parse(await res.json()) as LogWithRow[];
      },
    })),
  });

  const allLogsLoading = logQueries.some(q => q.isLoading);

  const logDataKey = logQueries.map(q => q.dataUpdatedAt).join(",");
  const rowLogsMap = useMemo(() => {
    const map = new Map<number, LogWithRow[]>();
    logQueries.forEach((q, idx) => {
      if (q.data) map.set(rowIds[idx], q.data);
      else map.set(rowIds[idx], []);
    });
    return map;
  }, [logDataKey]);

  const totalSets = useMemo(() => {
    let count = 0;
    rowLogsMap.forEach(logs => { count += logs.length; });
    return count;
  }, [rowLogsMap]);

  const rowAnalysis = useMemo(() => {
    return rows
      .sort((a, b) => a.orderLabel.localeCompare(b.orderLabel))
      .map(row => {
        const logs = rowLogsMap.get(row.id) || [];
        const prescribedReps = parseInt(row.reps) || 0;
        const prescribedRPE = row.intensityValue ? parseFloat(row.intensityValue) : null;

        let bestSet: LogWithRow | null = null;
        let bestE1RM = 0;

        for (const log of logs) {
          const w = Number(log.weight) || 0;
          const r = log.reps || 0;
          const rpe = Number(log.rpe) || 10;
          const e1rm = computeE1RM(w, r, rpe);
          if (e1rm > bestE1RM) {
            bestE1RM = e1rm;
            bestSet = log;
          }
        }

        let status: "hit" | "miss" | "partial" = "miss";
        if (logs.length === 0) {
          status = "miss";
        } else {
          const hasFullSet = logs.some(log => {
            const actualReps = log.reps || 0;
            const actualRPE = Number(log.rpe) || 10;
            const repsOk = actualReps >= prescribedReps;
            const rpeOk = prescribedRPE === null || actualRPE <= prescribedRPE + 1;
            return repsOk && rpeOk;
          });
          status = hasFullSet ? "hit" : "partial";
        }

        return {
          row,
          logs,
          bestSet,
          bestE1RM: Math.round(bestE1RM),
          status,
          prescribedReps,
          prescribedRPE,
        };
      });
  }, [rows, rowLogsMap]);

  const bestAnchorE1RM = useMemo(() => {
    let best = { e1rm: 0, liftName: "", weight: 0, reps: 0, rpe: 0 };
    for (const ra of rowAnalysis) {
      if (ra.row.isAnchor && ra.bestSet && ra.bestE1RM > best.e1rm) {
        best = {
          e1rm: ra.bestE1RM,
          liftName: ra.row.liftName,
          weight: Number(ra.bestSet.weight) || 0,
          reps: ra.bestSet.reps || 0,
          rpe: Number(ra.bestSet.rpe) || 10,
        };
      }
    }
    return best.e1rm > 0 ? best : null;
  }, [rowAnalysis]);

  const notableMiss = useMemo(() => {
    return rowAnalysis.find(ra => ra.status === "miss" && ra.row.isAnchor) ||
           rowAnalysis.find(ra => ra.status === "miss");
  }, [rowAnalysis]);

  if (allLogsLoading) {
    return <div className="py-12"><LoadingSpinner text="Building report..." /></div>;
  }

  return (
    <div className="space-y-6 pb-20" data-testid="workout-report">
      <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-md" data-testid="banner-completed">
        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Workout completed</p>
          <p className="text-xs text-muted-foreground">
            Finished {format(new Date(workout.completedAt!), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4" data-testid="session-overview">
        <div className="gym-card p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Date</p>
          <p className="text-lg font-display font-bold text-foreground" data-testid="report-date">
            {workout.workoutDate ? format(new Date(workout.workoutDate), "MMM d") : "N/A"}
          </p>
        </div>
        <div className="gym-card p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Exercises</p>
          <p className="text-lg font-display font-bold text-foreground" data-testid="report-exercise-count">{rows.length}</p>
        </div>
        <div className="gym-card p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Sets Logged</p>
          <p className="text-lg font-display font-bold text-foreground" data-testid="report-set-count">{totalSets}</p>
        </div>
      </div>

      {(bestAnchorE1RM || notableMiss) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="performance-highlights">
          {bestAnchorE1RM && (
            <div className="gym-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Best e1RM</span>
              </div>
              <p className="text-3xl font-display font-bold text-foreground" data-testid="report-best-e1rm">
                {bestAnchorE1RM.e1rm} <span className="text-sm text-muted-foreground">lbs</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1" data-testid="report-best-e1rm-details">
                {bestAnchorE1RM.liftName}: {bestAnchorE1RM.weight} lbs x {bestAnchorE1RM.reps} @{bestAnchorE1RM.rpe}
              </p>
            </div>
          )}
          {notableMiss && (
            <div className="gym-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Notable Miss</span>
              </div>
              <p className="text-lg font-bold text-foreground" data-testid="report-notable-miss">
                {notableMiss.row.liftName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Prescribed {notableMiss.row.sets}x{notableMiss.row.reps}
                {notableMiss.prescribedRPE ? ` @${notableMiss.prescribedRPE}` : ""} — no sets logged
              </p>
            </div>
          )}
        </div>
      )}

      <div data-testid="prescription-vs-actual">
        <h3 className="text-sm uppercase text-muted-foreground font-bold tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" /> Prescription vs Actual
        </h3>
        <div className="space-y-2">
          {rowAnalysis.map(({ row, logs, bestSet, bestE1RM, status, prescribedReps, prescribedRPE }) => (
            <div key={row.id} className="gym-card p-4" data-testid={`report-row-${row.id}`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-display font-bold text-primary flex-shrink-0">{row.orderLabel}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{row.liftName}</span>
                      {row.isAnchor && <Anchor className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rx: {row.sets}x{prescribedReps}
                      {prescribedRPE ? ` @${prescribedRPE} ${row.intensityType}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  {bestSet ? (
                    <span className="text-sm font-bold text-foreground" data-testid={`report-best-set-${row.id}`}>
                      {Number(bestSet.weight)} x {bestSet.reps}{bestSet.rpe ? ` @${bestSet.rpe}` : ""}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No sets</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {logs.length} set{logs.length !== 1 ? "s" : ""}
                  </span>
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border flex-wrap">
        <Link href="/progress">
          <Button variant="default" data-testid="button-view-progress">
            <TrendingUp className="w-4 h-4 mr-2" /> View Progress
          </Button>
        </Link>
        <Button variant="outline" onClick={onEditLogs} data-testid="button-edit-logs">
          <Pencil className="w-4 h-4 mr-2" /> Edit Logs
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "hit" | "miss" | "partial" }) {
  if (status === "hit") {
    return (
      <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-500/20" data-testid="badge-hit">
        Hit
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-yellow-500/20" data-testid="badge-partial">
        Partial
      </span>
    );
  }
  return (
    <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-500/20" data-testid="badge-miss">
      Miss
    </span>
  );
}

function ExerciseRowCard({ row, sessionDate, workoutId }: { row: WorkoutRow; sessionDate: string; workoutId: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [editingRow, setEditingRow] = useState(false);
  const [deletingRow, setDeletingRow] = useState(false);
  const [editingLog, setEditingLog] = useState<(Log & { row: WorkoutRow }) | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);

  const { mutate: logSet, isPending } = useCreateLog();
  const { data: logs } = useLogs({ workoutRowId: row.id.toString() });

  const handleLog = () => {
    if (!weight || !reps) {
      toast({ title: "Incomplete", description: "Please enter weight and reps", variant: "destructive" });
      return;
    }

    logSet({
      workoutRowId: row.id,
      userId: user?.id || "temp", 
      weight: weight,
      reps: parseInt(reps),
      rpe: rpe ? rpe : null,
      notes: "",
      date: new Date(sessionDate + "T12:00:00").toISOString(),
    }, {
      onSuccess: () => {
        toast({ title: "Set Logged", description: `${weight} lbs x ${reps}` });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="gym-card overflow-visible">
      <div 
        className="bg-card p-4 border-b border-border flex items-start justify-between cursor-pointer hover-elevate transition-colors rounded-t-md"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center min-w-[3rem]">
            <span className="text-2xl font-display font-bold text-primary">{row.orderLabel}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-foreground" data-testid={`text-row-name-${row.id}`}>{row.liftName}</h3>
              {row.isAnchor && (
                <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-red-500/20">
                  <Anchor className="w-3 h-3" /> Anchor
                </span>
              )}
            </div>
            {row.variant && <p className="text-sm text-muted-foreground">{row.variant}</p>}
            <div className="mt-1 flex gap-3 text-sm font-medium flex-wrap">
              <span className="bg-secondary px-2 py-0.5 rounded text-foreground">{row.sets} Sets</span>
              <span className="bg-secondary px-2 py-0.5 rounded text-foreground">{row.reps} Reps</span>
              <span className="bg-secondary px-2 py-0.5 rounded text-foreground">
                {row.intensityValue ? `@${row.intensityValue}` : ""} {row.intensityType}
              </span>
              {row.rest && <span className="text-muted-foreground italic ml-2">{row.rest} rest</span>}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" data-testid={`button-row-menu-${row.id}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingRow(true); }} data-testid={`button-edit-row-${row.id}`}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Exercise
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeletingRow(true); }} className="text-destructive" data-testid={`button-delete-row-${row.id}`}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="p-4 bg-background/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs uppercase text-muted-foreground mb-1 block">Weight (lbs)</Label>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="0.0" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)}
                    className="gym-input text-center font-bold text-2xl h-14"
                    data-testid={`input-weight-${row.id}`}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs uppercase text-muted-foreground mb-1 block">Reps</Label>
                  <Input 
                    type="number" 
                    placeholder="#" 
                    value={reps} 
                    onChange={e => setReps(e.target.value)}
                    className="gym-input text-center font-bold text-2xl h-14"
                    data-testid={`input-reps-${row.id}`}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs uppercase text-muted-foreground mb-1 block">RPE</Label>
                  <Input 
                    type="number" 
                    placeholder="@" 
                    value={rpe} 
                    onChange={e => setRpe(e.target.value)}
                    className="gym-input text-center font-bold text-2xl h-14"
                    data-testid={`input-rpe-${row.id}`}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleLog} 
                disabled={isPending}
                className="w-full h-12 text-lg font-bold uppercase tracking-widest"
                data-testid={`button-log-set-${row.id}`}
              >
                {isPending ? "Logging..." : "Log Set"}
              </Button>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <History className="w-4 h-4" /> Session Logs
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {logs?.map((log, idx) => (
                  <div key={log.id} className="flex justify-between items-center text-sm p-2 bg-card rounded border border-border/50 group/log">
                    <span className="text-muted-foreground">Set {idx + 1}</span>
                    <span className="font-bold text-foreground" data-testid={`text-log-${log.id}`}>{log.weight} lbs x {log.reps}</span>
                    <span className="text-primary font-medium">{log.rpe ? `@${log.rpe}` : ""}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingLog(log)} data-testid={`button-edit-log-${log.id}`}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setDeletingLogId(log.id)} data-testid={`button-delete-log-${log.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!logs || logs.length === 0) && (
                  <div className="text-muted-foreground text-sm italic">No sets logged yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingRow && (
        <EditRowDialog
          row={row}
          open={editingRow}
          onOpenChange={setEditingRow}
        />
      )}

      <DeleteRowConfirm
        open={deletingRow}
        onOpenChange={setDeletingRow}
        rowId={row.id}
        workoutId={workoutId}
      />

      {editingLog && (
        <EditLogDialog
          log={editingLog}
          open={!!editingLog}
          onOpenChange={(open) => { if (!open) setEditingLog(null); }}
        />
      )}

      <DeleteLogConfirm
        open={!!deletingLogId}
        onOpenChange={(open) => { if (!open) setDeletingLogId(null); }}
        logId={deletingLogId}
      />
    </div>
  );
}

function AddExerciseDialog({ workoutId, triggerText }: { workoutId: number, triggerText?: string }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateWorkoutRow();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof rowSchema>>({
    resolver: zodResolver(rowSchema),
    defaultValues: {
      orderLabel: "",
      liftName: "",
      variant: "",
      sets: "3",
      reps: "5",
      intensityValue: "",
      intensityType: "RPE",
      rest: "2-3 min",
      isAnchor: false,
      movementFamily: "Accessory",
    }
  });

  const onSubmit = (data: z.infer<typeof rowSchema>) => {
    mutate({
      workoutId,
      ...data
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ title: "Exercise Added" });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" data-testid="button-add-exercise">
          {triggerText || (
            <><Plus className="w-4 h-4 mr-2" /> Add Exercise</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <ExerciseForm form={form} onSubmit={onSubmit} isPending={isPending} submitLabel="Add Exercise" />
      </DialogContent>
    </Dialog>
  );
}

function ExerciseForm({ form, onSubmit, isPending, submitLabel }: { form: any; onSubmit: (data: any) => void; isPending: boolean; submitLabel: string }) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <Label>Order</Label>
          <Input placeholder="1a" {...form.register("orderLabel")} className="bg-background" data-testid="input-row-order" />
        </div>
        <div className="col-span-3">
          <Label>Lift Name</Label>
          <Input placeholder="Bench Press" {...form.register("liftName")} className="bg-background" data-testid="input-row-lift" />
        </div>
      </div>
      
      <div>
        <Label>Variant / Details</Label>
        <Input placeholder="Pause 2s, -15% load" {...form.register("variant")} className="bg-background" data-testid="input-row-variant" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sets</Label>
          <Input placeholder="3" {...form.register("sets")} className="bg-background" data-testid="input-row-sets" />
        </div>
        <div>
          <Label>Reps</Label>
          <Input placeholder="5" {...form.register("reps")} className="bg-background" data-testid="input-row-reps" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Label>Intensity</Label>
          <Input placeholder="8" {...form.register("intensityValue")} className="bg-background" data-testid="input-row-intensity" />
        </div>
        <div className="col-span-2">
          <Label>Type</Label>
          <Select onValueChange={v => form.setValue("intensityType", v as any)} defaultValue={form.getValues("intensityType") || "RPE"}>
            <SelectTrigger className="bg-background" data-testid="select-intensity-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="RPE">RPE</SelectItem>
              <SelectItem value="%1RM">%1RM</SelectItem>
              <SelectItem value="MAX">MAX</SelectItem>
              <SelectItem value="Text">Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Family (for Stats)</Label>
        <Select onValueChange={v => form.setValue("movementFamily", v as any)} defaultValue={form.getValues("movementFamily") || "Accessory"}>
          <SelectTrigger className="bg-background" data-testid="select-movement-family"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Bench">Bench</SelectItem>
            <SelectItem value="Squat">Squat</SelectItem>
            <SelectItem value="Deadlift">Deadlift</SelectItem>
            <SelectItem value="Row">Row</SelectItem>
            <SelectItem value="Carry">Carry</SelectItem>
            <SelectItem value="Conditioning">Conditioning</SelectItem>
            <SelectItem value="Accessory">Accessory</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input 
          type="checkbox" 
          id="isAnchor" 
          {...form.register("isAnchor")} 
          className="w-5 h-5 rounded border-input bg-background text-primary focus:ring-primary"
          data-testid="checkbox-anchor"
        />
        <Label htmlFor="isAnchor" className="font-bold text-red-400">Mark as Anchor Set?</Label>
      </div>

      <div>
        <Label>Rest</Label>
        <Input placeholder="2-3 min" {...form.register("rest")} className="bg-background" data-testid="input-row-rest" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full font-bold uppercase mt-4" data-testid="button-submit-exercise">
        {isPending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function EditRowDialog({ row, open, onOpenChange }: { row: WorkoutRow; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useUpdateWorkoutRow();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof rowSchema>>({
    resolver: zodResolver(rowSchema),
    defaultValues: {
      orderLabel: row.orderLabel,
      liftName: row.liftName,
      variant: row.variant || "",
      sets: row.sets,
      reps: row.reps,
      intensityValue: row.intensityValue || "",
      intensityType: (row.intensityType as any) || "RPE",
      rest: row.rest || "",
      isAnchor: row.isAnchor ?? false,
      movementFamily: (row.movementFamily as any) || "Accessory",
    },
  });

  const onSubmit = (data: z.infer<typeof rowSchema>) => {
    mutate({ id: row.id, data: { workoutId: row.workoutId, ...data } }, {
      onSuccess: () => { onOpenChange(false); toast({ title: "Exercise Updated" }); },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Exercise</DialogTitle></DialogHeader>
        <ExerciseForm form={form} onSubmit={onSubmit} isPending={isPending} submitLabel="Save Changes" />
      </DialogContent>
    </Dialog>
  );
}

function DeleteRowConfirm({ open, onOpenChange, rowId, workoutId }: { open: boolean; onOpenChange: (open: boolean) => void; rowId: number; workoutId: number }) {
  const { mutate, isPending } = useDeleteWorkoutRow();
  const { toast } = useToast();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
          <AlertDialogDescription>This will delete this exercise and all its logged sets. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete-row"
            onClick={() => {
              mutate({ id: rowId, workoutId }, {
                onSuccess: () => { onOpenChange(false); toast({ title: "Exercise Deleted" }); },
                onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditWorkoutDialog({ workout, open, onOpenChange }: { workout: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useUpdateWorkout();
  const { toast } = useToast();
  const schema = z.object({ name: z.string().min(1), description: z.string().optional(), workoutDate: z.string().min(1) });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workout.name,
      description: workout.description || "",
      workoutDate: workout.workoutDate ? format(new Date(workout.workoutDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    mutate({ id: workout.id, data: { name: data.name, description: data.description, workoutDate: data.workoutDate + "T12:00:00" } as any }, {
      onSuccess: () => { onOpenChange(false); toast({ title: "Workout Updated" }); },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border-border">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">Edit Workout</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Workout Date</Label>
            <Input type="date" {...form.register("workoutDate")} className="bg-background" data-testid="input-edit-workout-date" />
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...form.register("name")} className="bg-background" data-testid="input-edit-workout-name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} className="bg-background" data-testid="input-edit-workout-desc" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full font-bold uppercase" data-testid="button-save-workout">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWorkoutConfirm({ open, onOpenChange, workoutId, programId, onDeleted }: { open: boolean; onOpenChange: (open: boolean) => void; workoutId: number; programId: number; onDeleted: () => void }) {
  const { mutate, isPending } = useDeleteWorkout();
  const { toast } = useToast();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
          <AlertDialogDescription>This will delete this workout, all its exercises, and all logged sets.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete-workout"
            onClick={() => {
              mutate({ id: workoutId, programId }, {
                onSuccess: () => { onOpenChange(false); toast({ title: "Workout Deleted" }); onDeleted(); },
                onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditLogDialog({ log, open, onOpenChange }: { log: Log & { row: WorkoutRow }; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useUpdateLog();
  const { toast } = useToast();
  const schema = z.object({
    weight: z.string().min(1, "Weight required"),
    reps: z.string().min(1, "Reps required"),
    rpe: z.string().optional(),
    date: z.string().optional(),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      weight: log.weight?.toString() || "",
      reps: log.reps?.toString() || "",
      rpe: log.rpe?.toString() || "",
      date: log.date ? format(new Date(log.date), "yyyy-MM-dd") : "",
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    mutate({
      id: log.id,
      data: {
        weight: data.weight,
        reps: parseInt(data.reps),
        rpe: data.rpe || null,
        date: data.date ? new Date(data.date + "T12:00:00").toISOString() : undefined,
      },
    }, {
      onSuccess: () => { onOpenChange(false); toast({ title: "Log Updated" }); },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border-border">
        <DialogHeader><DialogTitle>Edit Logged Set</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Weight (lbs)</Label>
              <Input type="number" step="0.1" {...form.register("weight")} className="bg-background" data-testid="input-edit-log-weight" />
            </div>
            <div>
              <Label>Reps</Label>
              <Input type="number" {...form.register("reps")} className="bg-background" data-testid="input-edit-log-reps" />
            </div>
            <div>
              <Label>RPE</Label>
              <Input type="number" step="0.5" {...form.register("rpe")} className="bg-background" data-testid="input-edit-log-rpe" />
            </div>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" {...form.register("date")} className="bg-background" data-testid="input-edit-log-date" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full font-bold uppercase" data-testid="button-save-log">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteLogConfirm({ open, onOpenChange, logId }: { open: boolean; onOpenChange: (open: boolean) => void; logId: number | null }) {
  const { mutate, isPending } = useDeleteLog();
  const { toast } = useToast();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Set?</AlertDialogTitle>
          <AlertDialogDescription>This logged set will be permanently removed.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete-log"
            onClick={() => {
              if (!logId) return;
              mutate(logId, {
                onSuccess: () => { onOpenChange(false); toast({ title: "Set Deleted" }); },
                onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
              });
            }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
