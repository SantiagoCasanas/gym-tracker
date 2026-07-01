import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Global default sections with their category.
// category ∈ { superior | inferior | core | cardio | otros }
const DEFAULT_SECTIONS: { name: string; category: string }[] = [
  { name: "Pecho", category: "superior" },
  { name: "Espalda", category: "superior" },
  { name: "Hombros", category: "superior" },
  { name: "Brazos", category: "superior" },
  { name: "Piernas", category: "inferior" },
  { name: "Glúteos", category: "inferior" },
  { name: "Pantorrillas", category: "inferior" },
  { name: "Core", category: "core" },
  { name: "Cardio", category: "cardio" },
];

// Idempotent: upsert by (name) for the global default sections. Runs safely
// multiple times — existing rows get their category refreshed, missing ones
// are created. All are global (userId: null, isDefault: true).
async function seedDefaultSections() {
  for (const { name, category } of DEFAULT_SECTIONS) {
    const existing = await prisma.bodySection.findFirst({
      where: { name, isDefault: true, userId: null },
    });
    if (existing) {
      if (existing.category !== category) {
        await prisma.bodySection.update({
          where: { id: existing.id },
          data: { category },
        });
        console.log(`  ~ default section updated: ${name} → ${category}`);
      }
    } else {
      await prisma.bodySection.create({
        data: { name, category, isDefault: true, userId: null },
      });
      console.log(`  + default section created: ${name} (${category})`);
    }
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.warn("  ! ADMIN_EMAIL/ADMIN_PASSWORD missing in .env — skipping admin seed");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", name },
    create: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`  + admin ensured: ${email}`);
}

async function main() {
  console.log("Seeding...");
  await seedDefaultSections();
  await seedAdmin();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
