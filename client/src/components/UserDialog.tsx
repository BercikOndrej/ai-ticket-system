import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { createUserSchema, editUserSchema } from "core/schemas/users";
import type { CreateUserInput, EditUserInput } from "core/schemas/users";
import apiClient from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/types/user";
import ErrorAlert from "@/components/ErrorAlert";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export default function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const isEdit = !!user;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [emailError, setEmailError] = useState("");

  const form = useForm<CreateUserInput | EditUserInput>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateUserInput | EditUserInput) =>
      isEdit
        ? apiClient.patch(`/api/users/${user.id}`, data).then((res) => res.data)
        : apiClient.post("/api/users", data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? "User updated." : "User created.");
      onOpenChange(false);
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setEmailError("A user with this email already exists.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setServerError("");
      setEmailError("");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((data) => {
            setServerError("");
            setEmailError("");
            mutate(data);
          })}
          noValidate
          autoComplete="off"
        >
          <div className="space-y-4 py-2">
            {serverError && <ErrorAlert message={serverError} />}

            <div className="space-y-1.5">
              <Label htmlFor="user-form-name">Name</Label>
              <Input
                id="user-form-name"
                type="text"
                placeholder="johndoe"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-form-email">Email</Label>
              <Input
                id="user-form-email"
                type="email"
                placeholder="john@example.com"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.email || !!emailError}
                {...form.register("email")}
              />
              {(form.formState.errors.email || emailError) && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.email?.message ?? emailError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-form-password">Password</Label>
              <Input
                id="user-form-password"
                type="password"
                placeholder={
                  isEdit ? "Leave blank to keep current password" : "Min. 8 characters, no spaces"
                }
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.password}
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit ? "Saving..." : "Creating..."
                : isEdit ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
