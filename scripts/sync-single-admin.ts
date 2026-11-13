import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const hash = await argon2.hash("Admin@123456", {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const superAdminRole = await prisma.role.findUnique({
    where: { code: "SUPER_ADMIN" },
  });

  if (!superAdminRole) {
    throw new Error("SUPER_ADMIN role not found in database.");
  }

  // Find or update admin
  let admin = await prisma.user.findFirst({
    where: { username: "admin", deletedAt: null },
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: "admin@poly.edu.vn",
        fullName: "Quản trị viên Hệ thống",
        passwordHash: hash,
        mustChangePassword: false,
        activationStatus: "ACTIVATED",
        accountStatus: "ACTIVE",
        userType: "ADMIN",
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log("Updated existing admin user:", admin.id);
  } else {
    admin = await prisma.user.create({
      data: {
        username: "admin",
        fullName: "Quản trị viên Hệ thống",
        email: "admin@poly.edu.vn",
        userType: "ADMIN",
        accountStatus: "ACTIVE",
        activationStatus: "ACTIVATED",
        provisioningMethod: "BOOTSTRAP",
        passwordHash: hash,
        mustChangePassword: false,
      },
    });
    console.log("Created admin user:", admin.id);
  }

  // Ensure SUPER_ADMIN role assigned
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: admin.id, roleId: superAdminRole.id },
    },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });

  // Delete any other users so exactly 1 admin exists
  const deletedExtra = await prisma.user.deleteMany({
    where: { id: { not: admin.id } },
  });
  console.log("Deleted extra users count:", deletedExtra.count);

  const finalUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      userType: true,
      mustChangePassword: true,
      activationStatus: true,
    },
  });
  console.log("Final DB Users (should be exactly 1):", JSON.stringify(finalUsers, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
