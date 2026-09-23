/**
 * `pnpm db:clear:demo` — removes the DEMO_NA dataset and nothing else.
 *
 * Only rows whose id starts with `demona-` are deleted (plus the automatic
 * side-effect rows hanging off them: notifications, stage history, sessions),
 * and only the storage/properties/demona-prop-* folders are removed from disk.
 *
 * Before touching anything it checks that no row created outside the demo
 * seed (a visit, a photo, a mandate… entered by hand in the admin) depends on
 * a demo row — if one does, it aborts and lists them instead of cascading
 * into real data. Demo users still referenced by real data are kept.
 *
 * Requires typing an explicit confirmation phrase in an interactive terminal.
 */
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { assertLocalDatabase, createPrisma, DEMO_ID_PREFIX, DEMO_TAG, MEDIA_STORAGE_ROOT } from "./shared";

const prisma = createPrisma();
const CONFIRMATION = `SUPPRIMER ${DEMO_TAG}`;

const demo = { startsWith: DEMO_ID_PREFIX };
const notDemo = { not: { startsWith: DEMO_ID_PREFIX } };

async function countDemoRows() {
  const [properties, media, owners, promoters, programs, lots, intermediaries, prospects, opportunities, visits, activities, notifications, mandates, commissions, users] =
    await Promise.all([
      prisma.property.count({ where: { id: demo } }),
      prisma.propertyMedia.count({ where: { id: demo } }),
      prisma.owner.count({ where: { id: demo } }),
      prisma.promoter.count({ where: { id: demo } }),
      prisma.developmentProgram.count({ where: { id: demo } }),
      prisma.developmentLot.count({ where: { id: demo } }),
      prisma.intermediary.count({ where: { id: demo } }),
      prisma.prospect.count({ where: { id: demo } }),
      prisma.opportunity.count({ where: { id: demo } }),
      prisma.visit.count({ where: { id: demo } }),
      prisma.activity.count({ where: { id: demo } }),
      prisma.notification.count({ where: { id: demo } }),
      prisma.mandate.count({ where: { id: demo } }),
      prisma.commissionCase.count({ where: { id: demo } }),
      prisma.user.count({ where: { id: demo } }),
    ]);
  return { properties, media, owners, promoters, programs, lots, intermediaries, prospects, opportunities, visits, activities, notifications, mandates, commissions, users };
}

/** Non-demo rows that point at a demo row — deleting the demo row would cascade into (or be blocked by) them. */
async function findRealDataDependingOnDemo(): Promise<string[]> {
  const onDemoProperty = { id: notDemo, propertyId: demo };
  const checks: [string, Promise<number>][] = [
    ["photos ajoutées sur un bien démo", prisma.propertyMedia.count({ where: onDemoProperty })],
    ["documents sur un bien démo", prisma.propertyDocument.count({ where: onDemoProperty })],
    ["liens externes sur un bien démo", prisma.propertyExternalLink.count({ where: onDemoProperty })],
    ["liens propriétaire sur un bien/propriétaire démo", prisma.propertyOwner.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { ownerId: demo }] } })],
    ["liens intermédiaire sur un bien/intermédiaire démo", prisma.propertyIntermediary.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { intermediaryId: demo }] } })],
    ["mandats sur un bien/propriétaire démo", prisma.mandate.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { ownerId: demo }] } })],
    ["dossiers de commission liés à la démo", prisma.commissionCase.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { mandateId: demo }, { opportunityId: demo }] } })],
    ["répartitions de commission liées à la démo", prisma.commissionShare.count({ where: { id: notDemo, OR: [{ commissionCaseId: demo }, { intermediaryId: demo }] } })],
    ["paiements de commission liés à la démo", prisma.commissionPayment.count({ where: { id: notDemo, commissionCaseId: demo } })],
    ["intérêts prospect liés à la démo", prisma.prospectPropertyInterest.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { prospectId: demo }] } })],
    ["visites liées à la démo", prisma.visit.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { prospectId: demo }, { opportunityId: demo }] } })],
    ["actions liées à la démo", prisma.activity.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { prospectId: demo }, { visitId: demo }, { opportunityId: demo }] } })],
    ["opportunités liées à la démo", prisma.opportunity.count({ where: { id: notDemo, OR: [{ propertyId: demo }, { prospectId: demo }] } })],
    ["programmes rattachés à un promoteur démo", prisma.developmentProgram.count({ where: { id: notDemo, promoterId: demo } })],
    ["lots rattachés à un programme démo", prisma.developmentLot.count({ where: { id: notDemo, programId: demo } })],
    ["biens rattachés à un programme/lot démo", prisma.property.count({ where: { id: notDemo, OR: [{ developmentProgramId: demo }, { developmentLotId: demo }] } })],
    ["lignes d'import pointant vers un bien démo", prisma.propertyImportRow.count({ where: { propertyId: demo } })],
  ];
  const results = await Promise.all(checks.map(async ([label, count]) => [label, await count] as const));
  return results.filter(([, count]) => count > 0).map(([label, count]) => `${count} ${label}`);
}

/** Demo users that real (non-demo) rows still reference — kept rather than breaking those rows. */
async function findDemoUsersStillReferenced(): Promise<Set<string>> {
  const demoUsers = await prisma.user.findMany({ where: { id: demo }, select: { id: true } });
  const kept = new Set<string>();
  for (const { id } of demoUsers) {
    const counts = await Promise.all([
      prisma.property.count({ where: { id: notDemo, OR: [{ createdById: id }, { assignedToId: id }, { updatedById: id }] } }),
      prisma.propertyMedia.count({ where: { id: notDemo, uploadedById: id } }),
      prisma.propertyDocument.count({ where: { id: notDemo, uploadedById: id } }),
      prisma.mandate.count({ where: { id: notDemo, createdById: id } }),
      prisma.commissionCase.count({ where: { id: notDemo, createdById: id } }),
      prisma.commissionShare.count({ where: { id: notDemo, userId: id } }),
      prisma.prospect.count({ where: { id: notDemo, OR: [{ createdById: id }, { assignedToId: id }] } }),
      prisma.visit.count({ where: { id: notDemo, OR: [{ createdById: id }, { assignedToId: id }] } }),
      prisma.activity.count({ where: { id: notDemo, OR: [{ createdById: id }, { assignedToId: id }] } }),
      prisma.opportunity.count({ where: { id: notDemo, OR: [{ createdById: id }, { assignedToId: id }] } }),
      prisma.opportunityStageHistory.count({ where: { changedById: id, opportunityId: notDemo } }),
      prisma.propertyImportBatch.count({ where: { createdById: id } }),
    ]);
    if (counts.some((count) => count > 0)) kept.add(id);
  }
  return kept;
}

async function confirm(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.error("Confirmation interactive requise : lancez `pnpm db:clear:demo` dans un terminal.");
    return false;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`Tapez « ${CONFIRMATION} » pour confirmer la suppression : `);
    return answer.trim() === CONFIRMATION;
  } finally {
    rl.close();
  }
}

async function removeDemoMediaFolders(): Promise<number> {
  let removed = 0;
  let entries: string[];
  try {
    entries = await readdir(MEDIA_STORAGE_ROOT);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (!entry.startsWith(`${DEMO_ID_PREFIX}prop-`)) continue;
    await rm(path.join(MEDIA_STORAGE_ROOT, entry), { recursive: true, force: true });
    removed += 1;
  }
  return removed;
}

async function main() {
  const host = assertLocalDatabase();
  const counts = await countDemoRows();
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  if (total === 0) {
    const folders = await removeDemoMediaFolders();
    console.log(`Aucune donnée ${DEMO_TAG} en base (${host}).${folders ? ` ${folders} dossier(s) photo démo orphelin(s) supprimé(s).` : ""}`);
    return;
  }

  console.log(`Données ${DEMO_TAG} présentes dans la base ${host} :`);
  for (const [label, count] of Object.entries(counts)) {
    if (count > 0) console.log(`  - ${label}: ${count}`);
  }

  const blockers = await findRealDataDependingOnDemo();
  if (blockers.length > 0) {
    console.error("\nNettoyage annulé : des données saisies hors démo dépendent de données démo :");
    for (const blocker of blockers) console.error(`  - ${blocker}`);
    console.error("Détachez ou supprimez ces éléments dans l'admin, puis relancez. Rien n'a été supprimé.");
    process.exitCode = 1;
    return;
  }

  const keptUsers = await findDemoUsersStillReferenced();
  if (keptUsers.size > 0) {
    console.warn(`\n${keptUsers.size} utilisateur(s) démo encore référencé(s) par des données réelles seront conservés.`);
  }

  console.log("\nSeules ces données de démonstration seront supprimées (utilisateurs réels, imports et saisies manuelles intacts).");
  if (!(await confirm())) {
    console.log("Annulé. Rien n'a été supprimé.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    const byProperty = { propertyId: demo };
    await tx.notification.deleteMany({
      where: { OR: [{ id: demo }, { prospectId: demo }, { visitId: demo }, { activityId: demo }, { opportunityId: demo }] },
    });
    await tx.commissionPayment.deleteMany({ where: { commissionCaseId: demo } });
    await tx.commissionShare.deleteMany({ where: { commissionCaseId: demo } });
    await tx.commissionCase.deleteMany({ where: { id: demo } });
    await tx.activity.deleteMany({ where: { id: demo } });
    await tx.visit.deleteMany({ where: { id: demo } });
    await tx.opportunityStageHistory.deleteMany({ where: { opportunityId: demo } });
    await tx.opportunity.deleteMany({ where: { id: demo } });
    await tx.prospectPropertyInterest.deleteMany({ where: { id: demo } });
    await tx.prospect.deleteMany({ where: { id: demo } });
    await tx.mandate.deleteMany({ where: { id: demo } });
    await tx.propertyOwner.deleteMany({ where: { id: demo } });
    await tx.propertyIntermediary.deleteMany({ where: { id: demo } });
    await tx.propertyMedia.deleteMany({ where: { id: demo, ...byProperty } });
    await tx.propertyPrivate.deleteMany({ where: byProperty });
    await tx.property.deleteMany({ where: { id: demo } });
    await tx.developmentLot.deleteMany({ where: { id: demo } });
    await tx.developmentProgram.deleteMany({ where: { id: demo } });
    await tx.promoter.deleteMany({ where: { id: demo } });
    await tx.owner.deleteMany({ where: { id: demo } });
    await tx.intermediary.deleteMany({ where: { id: demo } });
    await tx.user.deleteMany({ where: { id: { startsWith: DEMO_ID_PREFIX, notIn: [...keptUsers] } } });
  });

  const folders = await removeDemoMediaFolders();
  console.log(`Données ${DEMO_TAG} supprimées (${folders} dossier(s) photo démo retiré(s) de storage/properties).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
