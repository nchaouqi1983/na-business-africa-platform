"use server";

import { redirect } from "next/navigation";
import * as z from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, clearSessionCookie, getSessionCookie, decryptSession, SESSION_DURATION_MS } from "@/lib/auth/session";
import { isAdminAccessible } from "@/lib/auth/roles";

const LoginSchema = z.object({
  email: z.email({ error: "Adresse e-mail invalide." }),
  password: z.string().min(1, { error: "Mot de passe requis." }),
});

export type LoginState = { error: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Identifiants invalides." };
  }

  const { email, password } = parsed.data;
  const genericError: LoginState = { error: "E-mail ou mot de passe incorrect." };

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user?.id,
        metadata: user ? undefined : { email },
      },
    });
    return genericError;
  }

  // Checked only after the password matched, so the message never reveals
  // whether an arbitrary e-mail has a (disabled) account.
  if (!user.isActive) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN_DENIED_INACTIVE", entity: "User", entityId: user.id },
    });
    return { error: "Ce compte est désactivé. Contactez un administrateur." };
  }

  if (!isAdminAccessible(user.role)) {
    await prisma.auditLog.create({
      data: { userId: user.id, action: "LOGIN_DENIED_ROLE", entity: "User", entityId: user.id },
    });
    return { error: "Ce compte n'a pas accès à l'administration." };
  }

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "LOGIN_SUCCESS", entity: "Session", entityId: session.id },
  });

  await setSessionCookie(session.id, expiresAt);

  redirect("/admin");
}

export async function logout() {
  const token = await getSessionCookie();
  const payload = await decryptSession(token);

  if (payload) {
    const session = await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => null);
    if (session) {
      await prisma.auditLog.create({
        data: { userId: session.userId, action: "LOGOUT", entity: "Session", entityId: session.id },
      });
    }
  }

  await clearSessionCookie();
  redirect("/connexion");
}
