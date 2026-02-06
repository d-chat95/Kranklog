import { Layout } from "@/components/Layout";
import { usePrograms, useUpdateProgram, useDeleteProgram } from "@/hooks/use-programs";
import { Link } from "wouter";
import { Plus, Dumbbell, Calendar, Pencil, Trash2, MoreVertical } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/Loading";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Program } from "@shared/schema";

const editProgramSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export default function Programs() {
  const { data: programs, isLoading } = usePrograms();
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgramId, setDeletingProgramId] = useState<number | null>(null);

  if (isLoading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout
      header={
        <div className="flex justify-between items-center flex-wrap gap-1">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Programs</h1>
          <Link href="/programs/new">
            <Button data-testid="button-new-program">
              <Plus className="w-4 h-4 mr-2" /> <span className="hidden md:inline">New Program</span>
            </Button>
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
            <div key={program.id} className="gym-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <Link href={`/programs/${program.id}`} className="flex-1 cursor-pointer">
                <div>
                  <h3 className="text-2xl font-display font-bold group-hover:text-primary transition-colors" data-testid={`text-program-name-${program.id}`}>{program.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 
                      {program.createdAt ? format(new Date(program.createdAt), 'MMM d, yyyy') : 'Unknown'}
                    </span>
                  </div>
                  {program.description && (
                    <p className="mt-3 text-muted-foreground line-clamp-2">{program.description}</p>
                  )}
                </div>
              </Link>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" data-testid={`button-program-menu-${program.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingProgram(program)} data-testid={`button-edit-program-${program.id}`}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeletingProgramId(program.id)} className="text-destructive" data-testid={`button-delete-program-${program.id}`}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {editingProgram && (
        <EditProgramDialog
          program={editingProgram}
          open={!!editingProgram}
          onOpenChange={(open) => { if (!open) setEditingProgram(null); }}
        />
      )}

      <DeleteProgramDialog
        programId={deletingProgramId}
        open={!!deletingProgramId}
        onOpenChange={(open) => { if (!open) setDeletingProgramId(null); }}
      />
    </Layout>
  );
}

function EditProgramDialog({ program, open, onOpenChange }: { program: Program; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useUpdateProgram();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof editProgramSchema>>({
    resolver: zodResolver(editProgramSchema),
    defaultValues: {
      name: program.name,
      description: program.description || "",
    },
  });

  const onSubmit = (data: z.infer<typeof editProgramSchema>) => {
    mutate({ id: program.id, data }, {
      onSuccess: () => {
        onOpenChange(false);
        toast({ title: "Program Updated" });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase">Edit Program</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} className="bg-background" data-testid="input-edit-program-name" />
            {form.formState.errors.name && <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} className="bg-background" data-testid="input-edit-program-description" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full font-bold uppercase" data-testid="button-save-program">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProgramDialog({ programId, open, onOpenChange }: { programId: number | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useDeleteProgram();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!programId) return;
    mutate(programId, {
      onSuccess: () => {
        onOpenChange(false);
        toast({ title: "Program Deleted" });
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Program?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this program and all its workouts, exercises, and logged sets. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive text-destructive-foreground" data-testid="button-confirm-delete-program">
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
