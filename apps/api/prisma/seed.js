const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const roles = [
  {
    name: "Owner",
    description: "Demo foundation role for clinic ownership and governance."
  },
  {
    name: "Admin",
    description: "Demo foundation role for user, role, permission, and audit administration."
  },
  {
    name: "Doctor",
    description: "Demo foundation role for future doctor workflows."
  },
  {
    name: "Nurse",
    description: "Demo foundation role for future nursing workflows."
  },
  {
    name: "Receptionist",
    description: "Demo foundation role for future front-desk workflows."
  },
  {
    name: "Accountant",
    description: "Demo foundation role for future billing workflows."
  }
];

const permissions = [
  "users.read",
  "users.manage",
  "roles.read",
  "roles.manage",
  "audit.read",
  "patients.read",
  "patients.manage",
  "appointments.read",
  "appointments.manage",
  "encounters.read",
  "encounters.manage",
  "prescriptions.read",
  "prescriptions.manage",
  "investigations.read",
  "investigations.manage",
  "reports.read",
  "reports.manage",
  "billing.read",
  "billing.manage"
];

function describePermission(key) {
  const [area, action] = key.split(".");

  return `Foundation permission for future ${area} ${action} access.`;
}

async function main() {
  await prisma.branch.upsert({
    where: { code: "main" },
    update: {
      name: "Main Branch",
      status: "active"
    },
    create: {
      name: "Main Branch",
      code: "main",
      status: "active"
    }
  });

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        isSystemRole: true
      },
      create: {
        name: role.name,
        description: role.description,
        isSystemRole: true
      }
    });
  }

  for (const key of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: {
        description: describePermission(key),
        riskLevel: key.endsWith(".manage") ? "high" : "medium"
      },
      create: {
        key,
        description: describePermission(key),
        riskLevel: key.endsWith(".manage") ? "high" : "medium"
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
