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
      <div className="max-w-2xl space-y-8">
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
    </Layout>
  );
}
