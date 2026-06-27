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
  "patient.read",
  "patient.create",
  "patient.update",
  "patient.consent_read",
  "patient.consent_manage",
  "patient.consent_override",
  "appointment.read",
  "appointment.manage",
  "appointment.cancel",
  "appointment.no_show",
  "queue.read",
  "queue.manage",
  "queue.status_update",
  "vitals.create",
  "prep_note.create",
  "prep_note.read",
  "encounter.read",
  "encounter.create",
  "encounter.update_own",
  "encounter.sign",
  "encounter.correct_signed",
  "encounter.export",
  "prescription.read",
  "prescription.create",
  "prescription.update",
  "prescription.approve",
  "prescription.cancel",
  "prescription.export",
  "investigation.read",
  "investigation.create",
  "investigation.update",
  "investigation.cancel",
  "investigation.review",
  "report.read",
  "report.upload",
  "report.update",
  "report.review",
  "report.export",
  "report.void",
  "report.delete",
  "billing.read",
  "billing.manage",
  "payment.manage",
  "billing.adjust",
  "billing.void",
  "billing.report",
  "user.read",
  "user.manage",
  "role.read",
  "role.manage",
  "permission.read",
  "clinic_settings.manage",
  "branch.manage",
  "audit.read",
  "audit.export",
  "backup.manage",
  "restore_test.manage",
  "backup.metadata_read",
  "security.review",
  "session.manage",
  "config.read_safe"
];

const rolePermissionKeys = {
  Owner: permissions,
  Admin: [
    "user.read",
    "user.manage",
    "role.read",
    "role.manage",
    "permission.read",
    "clinic_settings.manage",
    "branch.manage",
    "audit.read"
  ],
  Doctor: [
    "patient.read",
    "patient.consent_read",
    "appointment.read",
    "queue.read",
    "prep_note.read",
    "encounter.read",
    "encounter.create",
    "encounter.update_own",
    "encounter.sign",
    "encounter.correct_signed",
    "prescription.read",
    "prescription.create",
    "prescription.update",
    "prescription.approve",
    "prescription.cancel",
    "investigation.read",
    "investigation.create",
    "investigation.update",
    "investigation.review",
    "report.read",
    "report.upload",
    "report.review"
  ],
  Nurse: [
    "patient.read",
    "appointment.read",
    "queue.read",
    "queue.status_update",
    "vitals.create",
    "prep_note.create",
    "prep_note.read",
    "encounter.read",
    "report.read"
  ],
  Receptionist: [
    "patient.read",
    "patient.create",
    "patient.update",
    "patient.consent_read",
    "patient.consent_manage",
    "appointment.read",
    "appointment.manage",
    "appointment.cancel",
    "appointment.no_show",
    "queue.read",
    "queue.manage",
    "queue.status_update",
    "payment.manage"
  ],
  Accountant: [
    "billing.read",
    "billing.manage",
    "payment.manage",
    "billing.adjust",
    "billing.void",
    "billing.report",
    "patient.read"
  ]
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

  if (process.env.SEED_DEMO_OWNER !== "false") {
    const email = process.env.DEMO_OWNER_EMAIL || "owner@prij.local";
    const password = process.env.DEMO_OWNER_PASSWORD || "LocalDev123!";

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
