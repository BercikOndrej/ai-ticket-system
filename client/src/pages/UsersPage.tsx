import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import UsersTable, { type User } from "@/components/UsersTable";
import UserDialog from "@/components/UserDialog";

export default function UsersPage() {
  const [dialogUser, setDialogUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/api/users").then((res) => res.data),
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
      />

      <UserDialog
        key={dialogUser?.id ?? "create"}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={dialogUser ?? undefined}
      />
    </div>
  );
}
