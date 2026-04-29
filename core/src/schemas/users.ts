import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^\S+$/, "Name must not contain spaces"),
  email: z.string().email("Enter a valid email address").max(254),
  // bcrypt only processes the first 72 bytes; cap here prevents CPU-exhaustion attacks
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/^\S+$/, "Password must not contain spaces"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^\S+$/, "Name must not contain spaces"),
  email: z.string().email("Enter a valid email address").max(254),
  // empty string = keep current password; bcrypt 72-byte cap prevents CPU-exhaustion attacks
  password: z.union([
    z.literal(""),
    z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/^\S+$/, "Password must not contain spaces"),
  ]),
});

export type EditUserInput = z.infer<typeof editUserSchema>;
