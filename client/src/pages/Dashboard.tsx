import { Layout } from "@/components/Layout";
import { usePrograms } from "@/hooks/use-programs";
import { Link } from "wouter";
import { ArrowRight, Trophy, PlayCircle, Calendar } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: programs, isLoading } = usePrograms();

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  // Find the most recent program
  const activeProgram = programs && programs.length > 0 ? programs[programs.length - 1] : null;

  return (
    <Layout 
      header={
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.firstName || 'Athlete'}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden border border-border">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground">
                {user?.firstName?.charAt(0) || "U"}
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Active Program Card */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-primary flex items-center gap-2">
              <PlayCircle className="w-5 h-5" /> Active Program
            </h2>
            <Link href="/programs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              View All
            </Link>
          </div>

          {activeProgram ? (
            <Link href={`/programs/${activeProgram.id}`}>
              <div className="gym-card p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3 border border-primary/20">
                    Current Cycle
                  </span>
                  <h3 className="text-4xl font-display font-bold mb-2">{activeProgram.name}</h3>
                  <p className="text-muted-foreground max-w-md line-clamp-2">{activeProgram.description || "No description provided."}</p>
                  
                  <div className="mt-6 flex items-center text-primary font-bold text-sm uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    Continue Training <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="gym-card p-8 text-center border-dashed border-2">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Active Programs</h3>
              <p className="text-muted-foreground mb-6">Start a new training cycle to begin tracking.</p>
              <Link href="/programs/new">
                <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                  Create Program
                </button>
              </Link>
            </div>
          )}
        </section>

        {/* Quick Stats / Recent Activity - Placeholder for now */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="gym-card p-5">
            <div className="flex items-center gap-3 mb-4 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <span className="font-display font-bold uppercase tracking-wide">Today's Date</span>
            </div>
            <p className="text-3xl font-bold">{format(new Date(), "EEEE, MMM do")}</p>
          </div>
          
          <div className="gym-card p-5">
            <div className="flex items-center gap-3 mb-4 text-muted-foreground">
              <Trophy className="w-5 h-5" />
              <span className="font-display font-bold uppercase tracking-wide">Workouts Logged</span>
            </div>
            <p className="text-3xl font-bold text-primary">--</p>
            <p className="text-xs text-muted-foreground mt-1">Keep consistent!</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
