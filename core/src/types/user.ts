import { UserRole } from "../enums";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type AssignableAgent = {
  id: string;
  name: string;
  email: string;
};
