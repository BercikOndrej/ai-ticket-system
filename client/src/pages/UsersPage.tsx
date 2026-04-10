import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import UsersTable from "@/components/UsersTable";
import CreateUserDialog from "@/components/CreateUserDialog";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const { data: users = [], isPending, isError } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/api/users").then((res) => res.data),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="text-muted-foreground mt-1">Manage system users.</p>

      <div className="mt-6 flex justify-end mb-4">
        <Button onClick={() => setOpen(true)}>Create User</Button>
      </div>

      <UsersTable users={users} isPending={isPending} isError={isError} />

      <CreateUserDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
