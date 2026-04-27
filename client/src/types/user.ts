import { UserRole } from "core/enums";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type AssignableAgent = Pick<User, "id" | "name" | "email">;
