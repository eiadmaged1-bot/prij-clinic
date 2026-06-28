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
  "patients.read",
  "patients.manage",
  "patient.consent_read",
  "patient.consent_manage",
  "patient.consent_override",
  "appointment.read",
  "appointment.manage",
  "appointments.read",
  "appointments.manage",
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
  "encounters.read",
  "encounters.manage",
  "prescription.read",
  "prescription.create",
  "prescription.update",
  "prescription.approve",
  "prescription.cancel",
  "prescription.export",
  "prescriptions.read",
  "prescriptions.manage",
  "investigation.read",
  "investigation.create",
  "investigation.update",
  "investigation.cancel",
  "investigation.review",
  "investigations.read",
  "investigations.manage",
  "report.read",
  "report.upload",
  "report.update",
  "report.review",
  "report.export",
  "report.void",
  "report.delete",
  "reports.read",
  "reports.manage",
  "pregnancy.read",
  "pregnancy.manage",
  "ob_ultrasound.read",
  "ob_ultrasound.manage",
  "billing.read",
  "billing.manage",
  "payment.manage",
  "billing.adjust",
  "billing.void",
  "billing.report",
  "dashboard.read",
  "ai_draft.request",
  "ai_draft.read",
  "ai_draft.review",
  "ai_draft.approve",
  "ai_draft.reject",
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
    "patients.read",
    "patients.manage",
    "patient.consent_read",
    "appointment.read",
    "appointments.read",
    "queue.read",
    "prep_note.read",
    "encounter.read",
    "encounter.create",
    "encounter.update_own",
    "encounter.sign",
    "encounter.correct_signed",
    "encounters.read",
    "encounters.manage",
    "prescription.read",
    "prescription.create",
    "prescription.update",
    "prescription.approve",
    "prescription.cancel",
    "prescriptions.read",
    "prescriptions.manage",
    "investigation.read",
    "investigation.create",
    "investigation.update",
    "investigation.review",
    "investigations.read",
    "investigations.manage",
    "report.read",
    "report.upload",
    "report.review",
    "reports.read",
    "reports.manage",
    "pregnancy.read",
    "pregnancy.manage",
    "ob_ultrasound.read",
    "ob_ultrasound.manage",
    "ai_draft.request",
    "ai_draft.read",
    "ai_draft.review",
    "ai_draft.approve",
    "ai_draft.reject"
  ],
  Nurse: [
    "patient.read",
    "patients.read",
    "appointment.read",
    "appointments.read",
    "queue.read",
    "queue.status_update",
    "vitals.create",
    "prep_note.create",
    "prep_note.read",
    "encounter.read",
    "encounters.read",
    "report.read",
    "reports.read",
    "pregnancy.read",
    "ob_ultrasound.read"
  ],
  Receptionist: [
    "patient.read",
    "patient.create",
    "patient.update",
    "patients.read",
    "patients.manage",
    "patient.consent_read",
    "patient.consent_manage",
    "appointment.read",
    "appointment.manage",
    "appointments.read",
    "appointments.manage",
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
    "dashboard.read",
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
      name: "Demo Branch A",
      status: "active"
    },
    create: {
      name: "Demo Branch A",
      code: "main",
      status: "active"
    }
  });

  const branchB = await prisma.branch.upsert({
    where: { code: "demo-b" },
    update: {
      name: "Demo Branch B",
      status: "active"
    },
    create: {
      name: "Demo Branch B",
      code: "demo-b",
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

  let demoOwner = null;

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

    demoOwner = owner;
  }

  const localAdminPassword = process.env.DEMO_ADMIN_PASSWORD || "eyad";
  const localAdmin = await prisma.user.upsert({
    where: { email: "eyad.admin@prij.local" },
    update: {
      loginId: "eyad",
      displayName: "Eyad Admin",
      status: "active",
      branchId: mainBranch.id,
      passwordHash: await hashPassword(localAdminPassword),
      failedLoginCount: 0,
      lockedUntil: null
    },
    create: {
      email: "eyad.admin@prij.local",
      loginId: "eyad",
      displayName: "Eyad Admin",
      status: "active",
      branchId: mainBranch.id,
      passwordHash: await hashPassword(localAdminPassword)
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId_branchId: {
        userId: localAdmin.id,
        roleId: roleByName.get("Owner").id,
        branchId: mainBranch.id
      }
    },
    update: {},
    create: {
      userId: localAdmin.id,
      roleId: roleByName.get("Owner").id,
      branchId: mainBranch.id,
      createdByUserId: demoOwner?.id
    }
  });

  if (!demoOwner) {
    demoOwner = localAdmin;
  }

  const demoPassword = process.env.DEMO_TEST_PASSWORD || "LocalDev123!";
  const demoUsers = [
    ["demo.owner@prij.local", "Demo Owner User", "Owner", mainBranch.id],
    ["demo.doctor@prij.local", "Demo Doctor User", "Doctor", mainBranch.id],
    ["demo.reception@prij.local", "Demo Reception User", "Receptionist", mainBranch.id],
    ["demo.accountant@prij.local", "Demo Accountant User", "Accountant", mainBranch.id],
    ["demo.nurse@prij.local", "Demo Nurse User", "Nurse", branchB.id]
  ];

  for (const [email, displayName, roleName, branchId] of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        displayName,
        status: "active",
        branchId,
        passwordHash: await hashPassword(demoPassword),
        failedLoginCount: 0,
        lockedUntil: null
      },
      create: {
        email,
        displayName,
        status: "active",
        branchId,
        passwordHash: await hashPassword(demoPassword)
      }
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId_branchId: {
          userId: user.id,
          roleId: roleByName.get(roleName).id,
          branchId
        }
      },
      update: {},
      create: {
        userId: user.id,
        roleId: roleByName.get(roleName).id,
        branchId,
        createdByUserId: demoOwner?.id
      }
    });
  }

  const serviceItems = [
    ["CONSULT-GYN", "Gynecology consultation", "Consultation", "500.00", "EGP"],
    ["US-OB-BASIC", "OB ultrasound basic", "Ultrasound", "750.00", "EGP"],
    ["LAB-PANEL-DEMO", "Demo lab panel", "Investigations", "350.00", "EGP"],
    ["FOLLOW-UP", "Follow-up visit", "Consultation", "300.00", "EGP"]
  ];

  for (const [code, name, category, price, currency] of serviceItems) {
    await prisma.serviceItem.upsert({
      where: { code },
      update: { name, category, price, currency, active: true },
      create: { code, name, category, price, currency, active: true }
    });
  }

  const demoPatientA = await prisma.patient.upsert({
    where: { medicalRecordNumber: "DEMO-MRN-001" },
    update: {
      firstName: "Demo",
      lastName: "Patient A",
      status: "active",
      branchId: mainBranch.id,
      notes: "Local demo registration record only."
    },
    create: {
      medicalRecordNumber: "DEMO-MRN-001",
      firstName: "Demo",
      lastName: "Patient A",
      status: "active",
      branchId: mainBranch.id,
      notes: "Local demo registration record only.",
      createdByUserId: demoOwner?.id
    }
  });

  await prisma.patient.upsert({
    where: { medicalRecordNumber: "DEMO-MRN-002" },
    update: {
      firstName: "Demo",
      lastName: "Patient B",
      status: "active",
      branchId: branchB.id,
      notes: "Local demo registration record only."
    },
    create: {
      medicalRecordNumber: "DEMO-MRN-002",
      firstName: "Demo",
      lastName: "Patient B",
      status: "active",
      branchId: branchB.id,
      notes: "Local demo registration record only.",
      createdByUserId: demoOwner?.id
    }
  });

  const todayStart = new Date();
  todayStart.setHours(10, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 30 * 60 * 1000);

  let demoAppointment = await prisma.appointment.findFirst({
    where: {
      branchId: mainBranch.id,
      patientId: demoPatientA.id,
      startAt: todayStart
    }
  });

  if (!demoAppointment) {
    demoAppointment = await prisma.appointment.create({
      data: {
        branchId: mainBranch.id,
        patientId: demoPatientA.id,
        doctorId: demoOwner?.id,
        startAt: todayStart,
        endAt: todayEnd,
        status: "booked",
        appointmentType: "Demo visit",
        source: "local_seed",
        notes: "Local demo appointment only.",
        createdByUserId: demoOwner?.id
      }
    });
  }

  const existingTicket = await prisma.queueTicket.findFirst({
    where: {
      branchId: mainBranch.id,
      patientId: demoPatientA.id,
      appointmentId: demoAppointment.id,
      status: "waiting"
    }
  });

  if (!existingTicket) {
    await prisma.queueTicket.create({
      data: {
        branchId: mainBranch.id,
        patientId: demoPatientA.id,
        appointmentId: demoAppointment.id,
        queueNumber: 1,
        status: "waiting",
        priority: "routine"
      }
    });
  }

  const demoReport = await prisma.report.findFirst({
    where: {
      patientId: demoPatientA.id,
      title: "Demo ultrasound report placeholder"
    }
  });

  if (!demoReport) {
    await prisma.report.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        category: "ultrasound",
        status: "review_pending",
        title: "Demo ultrasound report placeholder",
        source: "local_seed",
        resultSummary: "Local demo report summary only. Doctor review required.",
        uploadedByUserId: demoOwner?.id
      }
    });
  }

  let demoPregnancy = await prisma.pregnancy.findFirst({
    where: {
      patientId: demoPatientA.id,
      status: "active"
    }
  });

  if (!demoPregnancy) {
    demoPregnancy = await prisma.pregnancy.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        status: "active",
        gravida: 1,
        para: 0,
        riskLevel: "routine",
        notes: "Local demo pregnancy overview only.",
        createdByUserId: demoOwner?.id
      }
    });
  }

  const demoUltrasound = await prisma.obUltrasound.findFirst({
    where: {
      patientId: demoPatientA.id,
      pregnancyId: demoPregnancy.id
    }
  });

  if (!demoUltrasound) {
    await prisma.obUltrasound.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        pregnancyId: demoPregnancy.id,
        status: "draft",
        gestationalAgeWeeks: 12,
        gestationalAgeDays: 2,
        fetalHeartRateBpm: 150,
        presentation: "Demo placeholder",
        placenta: "Demo placeholder",
        amnioticFluid: "Demo placeholder",
        impressionText: "Draft local demo OB ultrasound note. Doctor review required.",
        createdByUserId: demoOwner?.id
      }
    });
  }

  let demoInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: "DEMO-INV-0001" }
  });

  if (!demoInvoice) {
    demoInvoice = await prisma.invoice.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        invoiceNumber: "DEMO-INV-0001",
        status: "issued",
        issueDate: new Date(),
        subtotalAmount: "500.00",
        discountAmount: "0.00",
        totalAmount: "500.00",
        amountPaid: "200.00",
        balanceAmount: "300.00",
        notes: "Local demo billing record only. No card or payment secrets stored.",
        createdByUserId: demoOwner?.id,
        issuedByUserId: demoOwner?.id,
        issuedAt: new Date(),
        items: {
          create: [
            {
              description: "Demo consultation service",
              quantity: 1,
              unitAmount: "500.00",
              lineAmount: "500.00",
              notes: "Local demo invoice item only."
            }
          ]
        }
      }
    });
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      invoiceId: demoInvoice.id,
      amount: "200.00",
      method: "cash",
      status: "recorded"
    }
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: demoInvoice.id,
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        method: "cash",
        amount: "200.00",
        referenceNote: "Local demo cash payment only.",
        recordedByUserId: demoOwner?.id
      }
    });
  }

  const existingAiDraft = await prisma.aiDraft.findFirst({
    where: {
      patientId: demoPatientA.id,
      draftType: "encounter_summary",
      modelProvider: "disabled_mock"
    }
  });

  if (!existingAiDraft) {
    await prisma.aiDraft.create({
      data: {
        patientId: demoPatientA.id,
        branchId: mainBranch.id,
        draftType: "encounter_summary",
        status: "pending_doctor_review",
        inputSourceSummary: "Local demo placeholder only. No external AI request was made.",
        generatedText: "AI draft placeholder only. External AI access is disabled. Doctor review is required before any future AI-assisted text could be used.",
        modelProvider: "disabled_mock",
        modelName: "no_external_ai",
        promptVersion: "placeholder_v1",
        requestedByUserId: demoOwner?.id
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
