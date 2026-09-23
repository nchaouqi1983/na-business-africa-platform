import * as z from "zod";
import { Role } from "@/lib/generated/prisma/enums";

export const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

const roleValues = Object.values(Role) as [Role, ...Role[]];

const nameSchema = z.string().trim().min(1, { error: "Nom requis." }).max(120);
const roleSchema = z.enum(roleValues, { error: "Rôle invalide." });

const passwordPair = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { error: `Au moins ${PASSWORD_MIN_LENGTH} caractères.` })
      .max(PASSWORD_MAX_LENGTH, { error: `Au plus ${PASSWORD_MAX_LENGTH} caractères.` }),
    passwordConfirm: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    error: "Les deux mots de passe ne correspondent pas.",
    path: ["passwordConfirm"],
  });

export const createUserSchema = z
  .object({
    name: nameSchema,
    email: z.string().trim().toLowerCase().email({ error: "E-mail invalide." }).max(200),
    role: roleSchema,
  })
  .and(passwordPair);

export const updateUserSchema = z.object({ name: nameSchema, role: roleSchema });

export const resetPasswordSchema = passwordPair;

export function parseCreateUserForm(formData: FormData) {
  return createUserSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    role: formData.get("role"),
    password: formData.get("password") ?? "",
    passwordConfirm: formData.get("passwordConfirm") ?? "",
  });
}

export function parseUpdateUserForm(formData: FormData) {
  return updateUserSchema.safeParse({ name: formData.get("name") ?? "", role: formData.get("role") });
}

export function parseResetPasswordForm(formData: FormData) {
  return resetPasswordSchema.safeParse({
    password: formData.get("password") ?? "",
    passwordConfirm: formData.get("passwordConfirm") ?? "",
  });
}
