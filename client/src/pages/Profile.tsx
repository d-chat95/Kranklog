import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <Layout header={<h1 className="text-3xl font-display font-bold">Profile</h1>}>
      <div className="gym-card p-8 max-w-md mx-auto text-center space-y-6">
        <div className="w-32 h-32 rounded-full bg-secondary mx-auto overflow-hidden border-4 border-background shadow-xl">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground text-4xl font-bold">
              {user?.firstName?.charAt(0) || "U"}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="pt-6 border-t border-border">
          <Button 
            onClick={() => logout()} 
            variant="destructive" 
            className="w-full uppercase font-bold tracking-widest"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </Layout>
  );
}
