import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const LOGIN = process.env.DEMO_ADMIN_LOGIN || process.env.DEMO_TEST_EMAIL || "eyad";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_TEST_PASSWORD;

if (!PASSWORD) throw new Error("Synthetic CI password is required.");

try {
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email: LOGIN, password: PASSWORD })
  });
  if (!loginResponse.ok) {
    throw new Error(`Guideline workflow login failed with ${loginResponse.status}: ${await loginResponse.text()}`);
  }

  const cookie = (loginResponse.headers.getSetCookie?.() ?? [])
    .map((value) => value.split(";", 1)[0])
    .join("; ");
  const csrf = /(?:^|;\s*)csrf-token=([^;]+)/.exec(cookie)?.[1];
  if (!cookie.includes("prij_clinic_session=")) throw new Error("Login did not establish a session.");

  const headers = {
    accept: "application/json",
    cookie,
    ...(csrf ? { "x-csrf-token": csrf } : {})
  };

  const suffix = Date.now();
  const source = await prisma.guidelineSource.create({
    data: {
      name: `Synthetic CI Guideline Source ${suffix}`,
      organization: "Synthetic CI",
      sourceType: "LINK_ONLY",
      defaultAccessLevel: "OWNER_DOCTOR",
      active: true,
      status: "active",
      notes: "Disposable integration-test source."
    }
  });

  const document = await prisma.guidelineDocument.create({
    data: {
      sourceId: source.id,
      title: `Synthetic CI Guideline ${suffix}`,
      specialty: "women_health",
      topic: "integration_test",
      organization: "Synthetic CI",
      guidelineStatus: "ACTIVE",
      documentType: "test_text",
      licenseStatus: "CHECK_REQUIRED",
      accessLevel: "OWNER_DOCTOR",
      reviewStatus: "reviewed_for_ci_only",
      citationLabel: `Synthetic CI Guideline ${suffix}`,
      chunks: {
        create: {
          chunkIndex: 0,
          text: "Synthetic guideline content used only to verify favorites, recent access, archive preservation, restore, and audit behavior.",
          normalizedText: "synthetic guideline content used only to verify favorites recent access archive preservation restore and audit behavior",
          citationLabel: `Synthetic CI Guideline ${suffix} · p1`,
          pageStart: 1,
          pageEnd: 1,
          reviewStatus: "reviewed_for_ci_only"
        }
      },
      sections: {
        create: {
          heading: "Synthetic verification section",
          sectionPath: "Synthetic verification section",
          pageStart: 1,
          pageEnd: 1,
          orderIndex: 0,
          text: "Synthetic verification section.",
          reviewStatus: "reviewed_for_ci_only"
        }
      }
    }
  });

  const favoriteResponse = await api(`/guidelines/user-library/documents/${document.id}/favorite`, "POST", headers);
  assertOk(favoriteResponse, "Favorite creation");

  const openedResponse = await api(`/guidelines/user-library/documents/${document.id}/opened`, "POST", headers);
  assertOk(openedResponse, "Recent-open recording");

  const stateResponse = await api("/guidelines/user-library/state", "GET", headers);
  assertOk(stateResponse, "User-library state");
  const state = await stateResponse.json();
  if (!state.favoriteIds?.includes(document.id)) throw new Error("Guideline favorite did not persist.");
  if (!state.favorites?.some((item) => item.id === document.id)) throw new Error("Favorite document was missing from the user library.");
  if (!state.recent?.some((item) => item.id === document.id)) throw new Error("Recently opened document was missing from the user library.");

  const archiveResponse = await api(`/guidelines/user-library/documents/${document.id}/archive`, "POST", headers, {
    reason: "Synthetic CI archive preservation verification.",
    confirmation: document.title
  });
  assertOk(archiveResponse, "Protected archive");

  const archived = await prisma.guidelineDocument.findUnique({
    where: { id: document.id },
    include: { chunks: true, sections: true }
  });
  if (!archived?.archivedAt || archived.guidelineStatus !== "ARCHIVED") {
    throw new Error("Guideline was not archived correctly.");
  }
  if (archived.chunks.length !== 1 || archived.sections.length !== 1) {
    throw new Error("Archiving removed guideline citations or indexed content.");
  }

  const favoriteRowsAfterArchive = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::int AS count FROM "GuidelineFavorite" WHERE "documentId" = $1::uuid',
    document.id
  );
  if (favoriteRowsAfterArchive[0]?.count !== 0) {
    throw new Error("Archived guideline remained in user Favorites.");
  }

  const restoreResponse = await api(`/guidelines/user-library/documents/${document.id}/restore`, "POST", headers);
  assertOk(restoreResponse, "Guideline restore");

  const restored = await prisma.guidelineDocument.findUnique({ where: { id: document.id } });
  if (!restored || restored.archivedAt !== null || restored.guidelineStatus !== "NEEDS_REVIEW") {
    throw new Error("Restored guideline did not return to Needs Review.");
  }

  const auditEvents = await prisma.auditLog.findMany({
    where: { resourceId: document.id },
    select: { action: true }
  });
  const actions = new Set(auditEvents.map((entry) => entry.action));
  for (const required of [
    "guideline.favorite_added",
    "guideline.document_opened",
    "guideline.document_archived_safe",
    "guideline.document_restored"
  ]) {
    if (!actions.has(required)) throw new Error(`Missing audit event: ${required}`);
  }

  console.log("PASS guideline Favorite persisted in the database");
  console.log("PASS Recently Opened was derived from audited access");
  console.log("PASS archive preserved file-index relationships and removed Favorites");
  console.log("PASS restore returned the guideline to Needs Review");
  console.log("PASS guideline library actions were audited");
} finally {
  await prisma.$disconnect();
}

async function api(path, method, headers, body) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...headers,
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

function assertOk(response, label) {
  if (!response.ok) {
    throw new Error(`${label} failed with HTTP ${response.status}.`);
  }
}
