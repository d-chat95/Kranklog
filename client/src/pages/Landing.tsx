import { Button } from "@/components/ui/button";
import { Dumbbell, TrendingUp, Notebook, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-2xl mx-auto space-y-6"
      >
        <div className="space-y-2">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest border border-primary/20 mb-4"
          >
            Strength OS v1.0
          </motion.div>
          <h1 className="text-7xl md:text-9xl font-bold font-display italic tracking-tighter text-foreground leading-none">
            KRANK<span className="text-primary">LOG</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-md mx-auto">
            Professional workout tracking for serious lifters. Focus on RPE, Anchors, and Progress.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto py-8">
          <FeatureCard icon={Dumbbell} title="Workouts" desc="Track Sets, Reps & RPE" />
          <FeatureCard icon={TrendingUp} title="Progress" desc="E1RM Estimation" />
          <FeatureCard icon={Notebook} title="Programs" desc="4-6 Week Cycles" />
          <FeatureCard icon={Shield} title="Anchors" desc="Hit Your Top Sets" />
        </div>

        <Button 
          onClick={handleLogin}
          size="lg" 
          className="bg-primary text-primary-foreground hover:bg-primary/90 text-xl font-display uppercase tracking-widest px-12 py-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all duration-300"
        >
          Start Training
        </Button>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-card/50 border border-border/50 p-4 rounded-xl backdrop-blur-sm">
      <Icon className="w-8 h-8 text-primary mb-2 mx-auto" />
      <h3 className="font-display font-bold text-lg">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
