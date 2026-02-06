import { Layout } from "@/components/Layout";
import { useCreateProgram } from "@/hooks/use-programs";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSuggestions } from "@/hooks/use-stats";
import { LoadingSpinner } from "@/components/ui/Loading";
import { BrainCircuit } from "lucide-react";

const programSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export default function CreateProgram() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateProgram();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: { name: "", description: "" }
  });

  const onSubmit = (data: z.infer<typeof programSchema>) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Program Created", description: "Let's add some workouts!" });
        setLocation("/programs");
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <Layout header={<h1 className="text-3xl font-display font-bold">New Program</h1>}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="gym-card p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input 
                id="name" 
                {...form.register("name")} 
                placeholder="Strength Block 1 - Hypertrophy"
                className="bg-background text-lg h-12"
              />
              {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description & Goals</Label>
              <Textarea 
                id="description" 
                {...form.register("description")} 
                placeholder="Focusing on volume for squat and bench..."
                className="bg-background min-h-[150px]"
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-lg hover:scale-[1.01] transition-transform">
              {isPending ? "Creating..." : "Create Program"}
            </Button>
          </form>
        </div>

        {/* Suggestions Column */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wide mb-2">
            <BrainCircuit className="w-5 h-5" /> AI Suggestions
          </div>
          <SuggestionCard family="Bench" />
          <SuggestionCard family="Deadlift" />
          <SuggestionCard family="Squat" />
        </div>
      </div>
    </Layout>
  );
}

function SuggestionCard({ family }: { family: string }) {
  const { data, isLoading } = useSuggestions(family);

  if (isLoading) return <div className="gym-card p-4"><LoadingSpinner text="" /></div>;
  if (!data || (!data.suggestion1x3 && !data.suggestion1x5)) return null;

  return (
    <div className="gym-card p-5 border-l-4 border-l-primary">
      <h3 className="font-bold text-lg mb-3">{family} Targets</h3>
      <div className="grid grid-cols-2 gap-4">
        {data.suggestion1x3 && (
          <div className="text-center bg-background rounded p-2">
            <div className="text-xs text-muted-foreground uppercase">1 x 3 @ 6</div>
            <div className="text-xl font-bold text-primary">{Math.round(data.suggestion1x3)}kg</div>
          </div>
        )}
        {data.suggestion1x5 && (
          <div className="text-center bg-background rounded p-2">
            <div className="text-xs text-muted-foreground uppercase">1 x 5 @ 6</div>
            <div className="text-xl font-bold text-primary">{Math.round(data.suggestion1x5)}kg</div>
          </div>
        )}
      </div>
    </div>
  );
}
