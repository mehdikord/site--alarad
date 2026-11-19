import bcrypt from 'bcryptjs';
import { prisma, log } from './client';

/** Default system administrator — phone: 09120000000 / password: admin1234 */
export async function adminSeeder() {
  const phone = '09120000000';
  const password = await bcrypt.hash('admin1234', 12);
  await prisma.admin.upsert({
    where: { phone },
    update: { password, isActive: true },
    create: { name: 'مدیر سیستم', phone, password, isActive: true },
  });
  log('AdminSeeder', `admin ${phone} ready`);
}
