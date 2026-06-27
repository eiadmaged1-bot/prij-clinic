const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { loadRootEnv } = require("./env");

loadRootEnv();

const { PrismaClient } = require("@prisma/client");

const scrypt = promisify(crypto.scrypt);
const prisma = new PrismaClient();

const roles = [
  ["Owner", "Demo-only owner role for clinic governance and Sprint 1 setup."],
  ["Admin", "Role for user, role, permission, audit, and branch administration."],
  ["Doctor", "Foundation role for future doctor workflows."],
  ["Nurse", "Foundation role for future nursing workflows."],
  ["Receptionist", "Foundation role for future front-desk workflows."],
  ["Accountant", "Foundation role for future billing workflows."]
];

const permissions = [
  "users.read",
  "users.manage",
  "roles.read",
  "roles.manage",
  "permissions.read",
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

const rolePermissionKeys = {
  Owner: permissions,
  Admin: [
    "users.read",
    "users.manage",
    "roles.read",
    "roles.manage",
    "permissions.read",
    "audit.read"
  ],
  Doctor: [
    "patients.read",
    "appointments.read",
    "encounters.read",
    "encounters.manage",
    "prescriptions.read",
    "prescriptions.manage",
    "investigations.read",
    "investigations.manage",
    "reports.read",
    "reports.manage"
  ],
  Nurse: ["patients.read", "appointments.read", "encounters.read", "reports.read"],
  Receptionist: [
    "patients.read",
    "patients.manage",
    "appointments.read",
    "appointments.manage"
  ],
  Accountant: ["billing.read", "billing.manage", "patients.read"]
};

function describePermission(key) {
  const [area, action] = key.split(".");

  return `Foundation permission for ${area} ${action} access.`;
}

function riskLevelFor(key) {
  if (key === "audit.read" || key.endsWith(".manage")) {
    return "high";
  }

  return "medium";
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, 64);

  return `scrypt:16384:8:1:${salt}:${key.toString("base64url")}`;
}

async function main() {
  const mainBranch = await prisma.branch.upsert({
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

  const roleByName = new Map();

  for (const [name, description] of roles) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        description,
        isSystemRole: true
      },
      create: {
        name,
        description,
        isSystemRole: true
      }
    });

    roleByName.set(name, role);
  }

  const permissionByKey = new Map();

  for (const key of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: {
        description: describePermission(key),
        riskLevel: riskLevelFor(key)
      },
      create: {
        key,
        description: describePermission(key),
        riskLevel: riskLevelFor(key)
      }
    });

    permissionByKey.set(key, permission);
  }

  for (const [roleName, keys] of Object.entries(rolePermissionKeys)) {
    const role = roleByName.get(roleName);

    for (const key of keys) {
      const permission = permissionByKey.get(key);

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  if (process.env.SEED_DEMO_OWNER === "true") {
    const email = process.env.DEMO_OWNER_EMAIL || "owner@example.test";
    const password = process.env.DEMO_OWNER_PASSWORD;

    if (!password) {
      throw new Error("DEMO_OWNER_PASSWORD is required when SEED_DEMO_OWNER=true.");
    }

    const owner = await prisma.user.upsert({
      where: { email },
      update: {
        displayName: "Demo Owner",
        status: "active",
        branchId: mainBranch.id,
        passwordHash: await hashPassword(password)
      },
      create: {
        email,
        displayName: "Demo Owner",
        status: "active",
        branchId: mainBranch.id,
        passwordHash: await hashPassword(password)
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_branchId: {
          userId: owner.id,
          roleId: roleByName.get("Owner").id,
          branchId: mainBranch.id
        }
      },
      update: {},
      create: {
        userId: owner.id,
        roleId: roleByName.get("Owner").id,
        branchId: mainBranch.id
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error.message);
    await prisma.$disconnect();
    process.exit(1);
  });
