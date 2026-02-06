import { Layout } from "@/components/Layout";
import { useWorkout, useCreateWorkoutRow } from "@/hooks/use-workouts";
import { useCreateLog, useLogs } from "@/hooks/use-logs";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Plus, CheckCircle2, History, Anchor } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { movementFamilyEnum, intensityTypeEnum } from "@shared/schema";

// --- Schema for adding exercise ---
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
  
  if (isLoading) return <Layout><LoadingSpinner /></Layout>;
  if (!workout) return <Layout><div className="p-8 text-center">Workout not found</div></Layout>;

  return (
    <Layout
      header={
        <div className="space-y-4">
          <Link href={`/programs/${workout.programId}`} className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Program
          </Link>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground uppercase">{workout.name}</h1>
              <p className="text-muted-foreground">{workout.description}</p>
            </div>
            <AddExerciseDialog workoutId={workoutId} />
          </div>
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        {workout.rows?.length === 0 && (
          <div className="text-center py-20 bg-card/50 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground mb-4">No exercises in this workout.</p>
            <AddExerciseDialog workoutId={workoutId} triggerText="Add First Exercise" />
          </div>
        )}

        {workout.rows?.sort((a,b) => a.orderLabel.localeCompare(b.orderLabel)).map((row) => (
          <ExerciseRow key={row.id} row={row} />
        ))}
      </div>
    </Layout>
  );
}

// --- Component: Exercise Row (The main logging unit) ---
function ExerciseRow({ row }: { row: any }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Local state for the inputs
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");

  const { mutate: logSet, isPending } = useCreateLog();
  
  // Fetch logs for this row to show history
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
    }, {
      onSuccess: () => {
        toast({ title: "Set Logged", description: `${weight} lbs x ${reps}` });
        // No need for manual invalidation here as useCreateLog handles it
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="gym-card overflow-hidden">
      {/* Header / Prescription */}
      <div 
        className="bg-card p-4 border-b border-border flex items-start justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center min-w-[3rem]">
            <span className="text-2xl font-display font-bold text-primary">{row.orderLabel}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-foreground">{row.liftName}</h3>
              {row.isAnchor && (
                <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 border border-red-500/20">
                  <Anchor className="w-3 h-3" /> Anchor
                </span>
              )}
            </div>
            {row.variant && <p className="text-sm text-muted-foreground">{row.variant}</p>}
            <div className="mt-1 flex gap-3 text-sm font-medium">
              <span className="bg-secondary px-2 py-0.5 rounded text-foreground">{row.sets} Sets</span>
              <span className="bg-secondary px-2 py-0.5 rounded text-foreground">{row.reps} Reps</span>
              <span className="bg-secondary px-2 py-0.5 rounded text-foreground">
                {row.intensityValue ? `@${row.intensityValue}` : ""} {row.intensityType}
              </span>
              {row.rest && <span className="text-muted-foreground italic ml-2">{row.rest} rest</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Logging Area */}
      {isExpanded && (
        <div className="p-4 bg-background/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input Section */}
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
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleLog} 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                {isPending ? "Logging..." : "Log Set"}
              </Button>
            </div>

            {/* Recent History Section */}
            <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <History className="w-4 h-4" /> Session Logs
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {logs?.map((log, idx) => (
                  <div key={log.id} className="flex justify-between items-center text-sm p-2 bg-card rounded border border-border/50">
                    <span className="text-muted-foreground">Set {idx + 1}</span>
                    <span className="font-bold text-foreground">{log.weight} lbs × {log.reps}</span>
                    <span className="text-primary font-medium">{log.rpe ? `@${log.rpe}` : ""}</span>
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
    </div>
  );
}

// --- Dialog: Add Exercise ---
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
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold uppercase border border-border">
          {triggerText || (
            <><Plus className="w-4 h-4 mr-2" /> Add Exercise</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card text-foreground border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <Label>Order</Label>
              <Input placeholder="1a" {...form.register("orderLabel")} className="bg-background" />
            </div>
            <div className="col-span-3">
              <Label>Lift Name</Label>
              <Input placeholder="Bench Press" {...form.register("liftName")} className="bg-background" />
            </div>
          </div>
          
          <div>
            <Label>Variant / Details</Label>
            <Input placeholder="Pause 2s, -15% load" {...form.register("variant")} className="bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sets</Label>
              <Input placeholder="3" {...form.register("sets")} className="bg-background" />
            </div>
            <div>
              <Label>Reps</Label>
              <Input placeholder="5" {...form.register("reps")} className="bg-background" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label>Intensity</Label>
              <Input placeholder="8" {...form.register("intensityValue")} className="bg-background" />
            </div>
            <div className="col-span-2">
              <Label>Type</Label>
              <Select onValueChange={v => form.setValue("intensityType", v as any)} defaultValue="RPE">
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
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
            <Select onValueChange={v => form.setValue("movementFamily", v as any)} defaultValue="Accessory">
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
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
            />
            <Label htmlFor="isAnchor" className="font-bold text-red-400">Mark as Anchor Set?</Label>
          </div>

          <Button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground font-bold uppercase mt-4">
            Add Exercise
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
