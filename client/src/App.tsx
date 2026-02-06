import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/Loading";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Programs from "@/pages/Programs";
import CreateProgram from "@/pages/CreateProgram";
import ProgramDetails from "@/pages/ProgramDetails";
import WorkoutSession from "@/pages/WorkoutSession";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/" />;

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Dashboard : Landing} />
      
      {/* Protected Routes */}
      <Route path="/programs">
        {() => <ProtectedRoute component={Programs} />}
      </Route>
      <Route path="/programs/new">
        {() => <ProtectedRoute component={CreateProgram} />}
      </Route>
      <Route path="/programs/:id">
        {() => <ProtectedRoute component={ProgramDetails} />}
      </Route>
      <Route path="/workouts/:id">
        {() => <ProtectedRoute component={WorkoutSession} />}
      </Route>
      <Route path="/progress">
        {() => <ProtectedRoute component={Progress} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
