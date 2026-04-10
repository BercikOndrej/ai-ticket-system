import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .regex(/^\S+$/, "Name must not contain spaces"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^\S+$/, "Password must not contain spaces"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .regex(/^\S+$/, "Name must not contain spaces"),
  email: z.string().email("Enter a valid email address"),
  // empty string = keep current password
  password: z.union([
    z.literal(""),
    z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^\S+$/, "Password must not contain spaces"),
  ]),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
