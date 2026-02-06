import { Layout } from "@/components/Layout";
import { useProgram } from "@/hooks/use-programs";
import { useCreateWorkout } from "@/hooks/use-workouts";
import { useRoute, Link } from "wouter";
import { Plus, ArrowLeft, ChevronRight, MoreVertical } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Schema for creating a workout
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof workoutSchema>>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof workoutSchema>) => {
    // Determine order index (last + 1)
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground">{program.name}</h1>
              <p className="text-muted-foreground max-w-xl mt-2">{program.description}</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-primary tracking-wide">Workouts</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wide">
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
                  />
                </div>
                <Button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground font-bold uppercase">
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
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <div className="gym-card p-5 flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="bg-secondary w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {workout.orderIndex}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{workout.name}</h3>
                    <p className="text-sm text-muted-foreground">{workout.description || "No description"}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
