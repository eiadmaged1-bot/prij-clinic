import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
const require = createRequire(import.meta.url);
require("../apps/api/prisma/env").loadRootEnv();
const { seedV152ProtocolReferences, v152ProtocolReferences } = require("../apps/api/prisma/seeds/v152-protocol-references");
const prisma = new PrismaClient(); const apply = process.argv.includes("--apply");
try {
  const before = await prisma.clinicalProtocol.count();
  const existing = await prisma.clinicalProtocol.count({ where: { code: { in: v152ProtocolReferences.map((item) => item.code) } } });
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", before, target: v152ProtocolReferences.length, create: v152ProtocolReferences.length - existing, update: existing }, null, 2));
  if (apply) {
    const result = await seedV152ProtocolReferences(prisma);
    const after = await prisma.clinicalProtocol.count();
    await prisma.auditLog.create({ data: { action: "protocol.reference.v152_source_imported", resourceType: "clinical_protocol", severity: "high", reason: "Idempotent source-verified protocol reference import", metadataJson: { ...result, after, patientSpecificActionsCreated: 0 } } });
    console.log(JSON.stringify({ ...result, after }, null, 2));
  }
} finally { await prisma.$disconnect(); }
