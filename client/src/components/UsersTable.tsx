import { Pencil, Trash2 } from "lucide-react";
import { UserRole } from "core/enums";
import { type User } from "@/types/user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorAlert from "@/components/ErrorAlert";

interface UsersTableProps {
  users: User[];
  isPending: boolean;
  isError: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UsersTable({ users, isPending, isError, onEdit, onDelete }: UsersTableProps) {
  return (
    <>
      {isError && (
        <ErrorAlert
          title="Failed to load users"
          message="An error occurred while loading users. Please try again."
        />
      )}
      <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isPending &&
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        {!isPending && !isError && users.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No users found.
            </TableCell>
          </TableRow>
        )}
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === UserRole.Admin ? "default" : "secondary"}>{user.role}</Badge>
            </TableCell>
            <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(user)}
                aria-label={`Edit ${user.name}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {user.role !== UserRole.Admin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(user)}
                  aria-label={`Delete ${user.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </>
  );
}
