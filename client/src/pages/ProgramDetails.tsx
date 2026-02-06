import { Layout } from "@/components/Layout";
import { useProgram, useUpdateProgram, useDeleteProgram } from "@/hooks/use-programs";
import { useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from "@/hooks/use-workouts";
import { useRoute, Link, useLocation } from "wouter";
import { Plus, ArrowLeft, ChevronRight, Pencil, Trash2, MoreVertical } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Workout } from "@shared/schema";

const workoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export default function ProgramDetails() {
  const [, params] = useRoute("/programs/:id");
  const programId = parseInt(params?.id || "0");
  const { data: program, isLoading } = useProgram(programId);
  const { mutate: createWorkout, isPending } = useCreateWorkout();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof workoutSchema>>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof workoutSchema>) => {
    const currentMaxOrder = program?.workouts?.reduce((max, w) => Math.max(max, w.orderIndex), 0) ?? 0;
    
    createWorkout({
      programId,
      name: data.name,
      description: data.description,
      orderIndex: currentMaxOrder + 1,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        toast({ title: "Workout Created", description: `${data.name} added to program.` });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;
  if (!program) return <Layout><div className="p-8 text-center">Program not found</div></Layout>;

  return (
    <Layout
      header={
        <div className="space-y-4">
          <Link href="/programs" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Programs
          </Link>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground" data-testid="text-program-title">{program.name}</h1>
              <p className="text-muted-foreground max-w-xl mt-2">{program.description}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-program-actions">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingProgram(true)} data-testid="button-edit-program">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeletingProgram(true)} className="text-destructive" data-testid="button-delete-program">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Program
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <h2 className="text-xl font-display font-bold text-primary tracking-wide">Workouts</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-workout">
                <Plus className="w-4 h-4 mr-2" /> Add Workout
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl uppercase">Add Workout</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (e.g., Week 1 Day 1)</Label>
                  <Input 
                    id="name" 
                    {...form.register("name")} 
                    className="bg-background border-input focus:border-primary"
                    placeholder="W1D1 - Lower Body"
                    data-testid="input-workout-name"
                  />
                  {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    {...form.register("description")} 
                    className="bg-background border-input focus:border-primary"
                    placeholder="Focus on squat technique..."
                    data-testid="input-workout-description"
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full font-bold uppercase" data-testid="button-create-workout">
                  {isPending ? "Creating..." : "Create Workout"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {program.workouts?.length === 0 && (
            <div className="text-center py-12 bg-card/50 rounded-xl border border-dashed border-border">
              <p className="text-muted-foreground">No workouts yet. Add one to get started.</p>
            </div>
          )}
          
          {program.workouts?.sort((a,b) => a.orderIndex - b.orderIndex).map((workout) => (
            <div key={workout.id} className="gym-card p-5 flex items-center justify-between group">
              <Link href={`/workouts/${workout.id}`} className="flex items-center gap-4 flex-1 cursor-pointer">
                <div className="bg-secondary w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {workout.orderIndex}
                </div>
                <div>
                  <h3 className="text-xl font-bold" data-testid={`text-workout-name-${workout.id}`}>{workout.name}</h3>
                  <p className="text-sm text-muted-foreground">{workout.description || "No description"}</p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid={`button-workout-menu-${workout.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingWorkout(workout)} data-testid={`button-edit-workout-${workout.id}`}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeletingWorkoutId(workout.id)} className="text-destructive" data-testid={`button-delete-workout-${workout.id}`}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingProgram && program && (
        <EditProgramDialog
          program={program}
          open={editingProgram}
          onOpenChange={(open) => setEditingProgram(open)}
        />
      )}

      <DeleteProgramConfirm
        open={deletingProgram}
        onOpenChange={setDeletingProgram}
        programId={programId}
        onDeleted={() => navigate("/programs")}
      />

      {editingWorkout && (
        <EditWorkoutDialog
          workout={editingWorkout}
          open={!!editingWorkout}
          onOpenChange={(open) => { if (!open) setEditingWorkout(null); }}
        />
      )}

      <DeleteWorkoutConfirm
        open={!!deletingWorkoutId}
        onOpenChange={(open) => { if (!open) setDeletingWorkoutId(null); }}
        workoutId={deletingWorkoutId}
        programId={programId}
      />
    </Layout>
  );
}

function EditProgramDialog({ program, open, onOpenChange }: { program: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useUpdateProgram();
  const { toast } = useToast();
  const editSchema = z.object({ name: z.string().min(1), description: z.string().optional() });

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: program.name, description: program.description || "" },
  });

  const onSubmit = (data: z.infer<typeof editSchema>) => {
    mutate({ id: program.id, data }, {
      onSuccess: () => { onOpenChange(false); toast({ title: "Program Updated" }); },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border-border">
        <DialogHeader><DialogTitle className="font-display text-2xl uppercase">Edit Program</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} className="bg-background" data-testid="input-edit-program-name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} className="bg-background" data-testid="input-edit-program-desc" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full font-bold uppercase" data-testid="button-save-program">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProgramConfirm({ open, onOpenChange, programId, onDeleted }: { open: boolean; onOpenChange: (open: boolean) => void; programId: number; onDeleted: () => void }) {
  const { mutate, isPending } = useDeleteProgram();
  const { toast } = useToast();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Program?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently delete this program and all its workouts, exercises, and logged sets.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete"
            onClick={() => {
              mutate(programId, {
                onSuccess: () => { onOpenChange(false); toast({ title: "Program Deleted" }); onDeleted(); },
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

function EditWorkoutDialog({ workout, open, onOpenChange }: { workout: Workout; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useUpdateWorkout();
  const { toast } = useToast();
  const schema = z.object({ name: z.string().min(1), description: z.string().optional() });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: workout.name, description: workout.description || "" },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    mutate({ id: workout.id, data }, {
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
            <Label>Name</Label>
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

function DeleteWorkoutConfirm({ open, onOpenChange, workoutId, programId }: { open: boolean; onOpenChange: (open: boolean) => void; workoutId: number | null; programId: number }) {
  const { mutate, isPending } = useDeleteWorkout();
  const { toast } = useToast();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
          <AlertDialogDescription>This will delete this workout, all its exercises, and all logged sets. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground"
            data-testid="button-confirm-delete-workout"
            onClick={() => {
              if (!workoutId) return;
              mutate({ id: workoutId, programId }, {
                onSuccess: () => { onOpenChange(false); toast({ title: "Workout Deleted" }); },
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
