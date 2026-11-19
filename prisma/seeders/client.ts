import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export function log(seeder: string, message: string) {
  console.log(`\x1b[32m✔\x1b[0m \x1b[1m${seeder}\x1b[0m ${message}`);
}
