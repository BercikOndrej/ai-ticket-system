import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import UsersTable from "@/components/UsersTable";
import { type User } from "@/types/user";
import UserDialog from "@/components/UserDialog";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogUser, setDialogUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/api/users").then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted.");
      setUserToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete user.");
      setUserToDelete(null);
    },
  });

  function openCreate() {
    setDialogUser(null);
    setIsDialogOpen(true);
  }

  function openEdit(user: User) {
    setDialogUser(user);
    setIsDialogOpen(true);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="text-muted-foreground mt-1">Manage system users.</p>

      <div className="mt-6 flex justify-end mb-4">
        <Button onClick={openCreate}>
          <UserPlus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <UsersTable
        users={users}
        isPending={isPending}
        isError={isError}
        onEdit={openEdit}
        onDelete={setUserToDelete}
      />

      <UserDialog
        key={dialogUser?.id ?? "create"}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={dialogUser ?? undefined}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {userToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the account. The user will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
