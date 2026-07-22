import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
const prisma = new PrismaClient();

async function run() {
  console.log("=== HISTORICAL DATA SAFETY TEST ===");
  
  let syntheticPatientId;
  let syntheticUserId;
  let legacyItemId;
  let orderId;
  let orderItemId;
  let favoriteId;
  let favoriteSetId;
  let favoriteSetItemId;

  try {
    // 1. Synthetic test user
    const user = await prisma.user.create({
      data: {
        email: "synthetic-safety-user@example.com",
        passwordHash: "fake",
        displayName: "Synth",
        status: "ACTIVE"
      }
    });
    syntheticUserId = user.id;

    // 2. Synthetic test patient
    const patient = await prisma.patient.create({
      data: {
        firstName: "Synthetic",
        lastName: "SafetyPatient",
        dateOfBirth: new Date("1990-01-01"),
        medicalRecordNumber: "MRN-SAFETY-999"
      }
    });
    syntheticPatientId = patient.id;

    // 3. Uniquely coded legacy catalogue item
    const legacyItem = await prisma.investigationCatalogItem.create({
      data: {
        code: "LEGACY_SYNTHETIC_TEST_CBC",
        name: "Old CBC Test Synthetic",
        category: "Laboratory",
        discipline: "General",
        active: true
      }
    });
    legacyItemId = legacyItem.id;

    // 4. InvestigationOrder and InvestigationOrderItem
    const doctor = await prisma.user.findFirst({ where: { status: 'active', userRoles: { some: { role: { name: 'Doctor' } } } } });
    const order = await prisma.investigationOrder.create({
      data: {
        patient: { connect: { id: syntheticPatientId } },
        doctor: { connect: { id: doctor.id } },
        items: {
          create: {
            itemCode: legacyItem.code,
            itemName: legacyItem.name,
            testName: legacyItem.name,
            category: "laboratory"
          }
        }
      },
      include: { items: true }
    });
    orderId = order.id;
    orderItemId = order.items[0].id;

    // 5. Reusable configuration references (Favorite)
    const favorite = await prisma.investigationFavorite.create({
      data: {
        userId: syntheticUserId,
        investigationCatalogItemId: legacyItemId
      }
    });
    favoriteId = favorite.id;

    // Reusable list/favorite-set
    const set = await prisma.investigationFavoriteSet.create({
      data: {
        name: "Synthetic Safety List",
        userId: syntheticUserId,
        scope: "personal",
        active: true,
        items: {
          create: {
            investigationCatalogItemId: legacyItemId,
            position: 0
          }
        }
      },
      include: { items: true }
    });
    favoriteSetId = set.id;
    favoriteSetItemId = set.items[0].id;

    console.log("Synthetic records created. Running actual seed for remapping...");
    
    // 6. Invoke actual seed path (normalization/remapping)
    // The actual seed maps based on name matching or code matching. 
    // Wait, the seed script ONLY maps specific legacy strings mapped to canonical codes.
    // If I created a fake legacy item "Old CBC Test Synthetic", the seed script does NOT know about it!
    // The seed script has a hardcoded aliases/mapping logic: it looks for exact strings.
    // "invoke the real catalogue normalization/remapping implementation"
    // I should create the legacy item with a name that is KNOWN to map to CBC.
    // Let's change the name to "Full blood count", which the spec says maps to COMPLETE_BLOOD_COUNT_CBC.
    
    await prisma.investigationCatalogItem.update({
      where: { id: legacyItemId },
      data: { name: "Full blood count" } // maps to CBC
    });

    execSync('npm run prisma:seed', { stdio: 'inherit' });

    // 7. Assertions
    const verifiedOrderItem = await prisma.investigationOrderItem.findUnique({ where: { id: orderItemId } });
    if (verifiedOrderItem.itemCode !== "LEGACY_SYNTHETIC_TEST_CBC") {
      throw new Error("FAIL: Historical InvestigationOrderItem itemCode was changed!");
    }

    const verifiedLegacyItem = await prisma.investigationCatalogItem.findUnique({ where: { id: legacyItemId } });
    if (!verifiedLegacyItem) throw new Error("FAIL: Legacy item was deleted!");
    if (verifiedLegacyItem.active !== false) throw new Error("FAIL: Legacy item was not archived!");

    const canonicalItem = await prisma.investigationCatalogItem.findFirst({
      where: { code: "COMPLETE_BLOOD_COUNT_CBC", active: true }
    });
    if (!canonicalItem) throw new Error("FAIL: Canonical CBC item not found");

    const verifiedFavorite = await prisma.investigationFavorite.findUnique({ where: { id: favoriteId } });
    if (verifiedFavorite.investigationCatalogItemId !== canonicalItem.id) {
      throw new Error(`FAIL: Favorite was not remapped! Expected ${canonicalItem.id}, got ${verifiedFavorite.investigationCatalogItemId}`);
    }

    const verifiedSetItem = await prisma.investigationFavoriteSetItem.findUnique({ where: { id: favoriteSetItemId } });
    if (verifiedSetItem.investigationCatalogItemId !== canonicalItem.id) {
      throw new Error(`FAIL: FavoriteSetItem was not remapped! Expected ${canonicalItem.id}, got ${verifiedSetItem.investigationCatalogItemId}`);
    }

    console.log("PASS: Historical data safety test completed successfully.");

  } finally {
    console.log("Cleaning up synthetic records...");
    if (favoriteSetItemId) await prisma.investigationFavoriteSetItem.deleteMany({ where: { id: favoriteSetItemId } });
    if (favoriteSetId) await prisma.investigationFavoriteSet.deleteMany({ where: { id: favoriteSetId } });
    if (favoriteId) await prisma.investigationFavorite.deleteMany({ where: { id: favoriteId } });
    if (orderItemId) await prisma.investigationOrderItem.deleteMany({ where: { id: orderItemId } });
    if (orderId) await prisma.investigationOrder.deleteMany({ where: { id: orderId } });
    if (legacyItemId) await prisma.investigationCatalogItem.deleteMany({ where: { id: legacyItemId } });
    if (syntheticPatientId) await prisma.patient.deleteMany({ where: { id: syntheticPatientId } });
    if (syntheticUserId) await prisma.user.deleteMany({ where: { id: syntheticUserId } });
  }
}

run().catch(e => {
  console.error(e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
