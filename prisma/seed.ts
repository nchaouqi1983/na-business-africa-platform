import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../lib/generated/prisma/client";

// Not importing lib/auth/password.ts here: it starts with `import "server-only"`,
// which only no-ops under Next.js's bundler. Run directly via tsx, it always throws.
const SALT_ROUNDS = 12;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set (see .env.example) to seed the dev admin account."
    );
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.SUPER_ADMIN },
    create: {
      email,
      passwordHash,
      role: Role.SUPER_ADMIN,
      name: "Administrateur (dev)",
    },
  });

  console.log(`Seeded dev admin account: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
