import { Layout } from "@/components/Layout";
import { usePrograms } from "@/hooks/use-programs";
import { Link } from "wouter";
import { Plus, Dumbbell, Calendar } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { format } from "date-fns";

export default function Programs() {
  const { data: programs, isLoading } = usePrograms();

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout
      header={
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Programs</h1>
          <Link href="/programs/new">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> <span className="hidden md:inline">New Program</span>
            </button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {programs?.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p>No programs found. Create one to get started.</p>
          </div>
        ) : (
          programs?.map((program) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <div className="gym-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer">
                <div>
                  <h3 className="text-2xl font-display font-bold group-hover:text-primary transition-colors">{program.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 
                      {program.createdAt ? format(new Date(program.createdAt), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  {program.description && (
                    <p className="mt-3 text-muted-foreground line-clamp-2">{program.description}</p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    View Workouts
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Layout>
  );
}
