import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../lib/generated/prisma/client";
import { tagTaxonomy } from "../lib/property-schema";
import { tagCategoryToDb } from "../lib/admin/property-enum-maps";

// Not importing lib/auth/password.ts here: it starts with `import "server-only"`,
// which only no-ops under Next.js's bundler. Run directly via tsx, it always throws.
const SALT_ROUNDS = 12;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdminUser() {
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

/** Loads the public tag taxonomy (lib/property-schema.ts) into PropertyTag —
 * upsert by slug, so re-running the seed never creates duplicates. */
async function seedPropertyTags() {
  let created = 0;
  let updated = 0;

  for (const tag of tagTaxonomy) {
    const result = await prisma.propertyTag.upsert({
      where: { slug: tag.slug },
      update: { labelFr: tag.label.fr, category: tagCategoryToDb[tag.category] },
      create: { slug: tag.slug, labelFr: tag.label.fr, category: tagCategoryToDb[tag.category] },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created += 1;
    else updated += 1;
  }

  console.log(`Seeded property tags: ${created} created, ${updated} already present (${tagTaxonomy.length} total).`);
}

async function main() {
  await seedAdminUser();
  await seedPropertyTags();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
