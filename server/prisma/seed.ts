import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const DEFAULT_SECTIONS = [
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Brazos",
  "Core",
];

async function seedDefaultSections() {
  for (const name of DEFAULT_SECTIONS) {
    const existing = await prisma.bodySection.findFirst({
      where: { name, isDefault: true, userId: null },
    });
    if (!existing) {
      await prisma.bodySection.create({
        data: { name, isDefault: true, userId: null },
      });
      console.log(`  + default section created: ${name}`);
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
