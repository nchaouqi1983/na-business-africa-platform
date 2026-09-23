/**
 * `pnpm db:seed:demo` — loads the fictional DEMO_NA dataset into the local
 * database. Idempotent: every row is upserted on a deterministic `demona-…`
 * id, so running it twice never duplicates anything (it only refreshes the
 * relative dates, keeping "aujourd'hui / en retard / à venir" accurate).
 *
 * Never touches the existing users, properties, imports or any row whose id
 * doesn't start with `demona-`. Counters (NHA/PRO/VIS/OPP/MAN/COM) are not
 * incremented: demo references use a "DEMO" segment instead of a year.
 */
import { randomBytes, createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { Prisma } from "../../lib/generated/prisma/client";
import type { OpportunityStage } from "../../lib/generated/prisma/enums";
import { defaultStageProbability, opportunityStageValues } from "../../lib/crm/opportunity-rules";
import { assertLocalDatabase, createPrisma, demoId, DEMO_TAG, MEDIA_STORAGE_ROOT } from "./shared";
import { renderDemoImage, type MediaVariant } from "./images";
import {
  demoActivities,
  demoCommissions,
  demoIntermediaries,
  demoMandates,
  demoNotifications,
  demoOpportunities,
  demoOwners,
  demoPrograms,
  demoPromoters,
  demoProperties,
  demoProspects,
  demoUsers,
  demoVisits,
  fakePhone,
  type DemoOpportunity,
  type UserKey,
} from "./data";

const prisma = createPrisma();

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date();

/** Local date `day` days from today at `hour`:00. */
function dayAt(day: number, hour = 10): Date {
  const date = new Date(now);
  date.setDate(date.getDate() + day);
  date.setHours(hour, 0, 0, 0);
  return date;
}
function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

const ref = (prefix: string, n: number) => `${prefix}-DEMO-${String(n).padStart(6, "0")}`;
const tagNote = (text: string) => `[${DEMO_TAG}] ${text}`;
const dec = (value: number | undefined | null) => (value === undefined || value === null ? null : new Prisma.Decimal(value));

const ids = {
  user: (key: UserKey) => demoId("user", key),
  owner: (n: number) => demoId("owner", n),
  promoter: (n: number) => demoId("promoter", n),
  program: (n: number) => demoId("program", n),
  lot: (program: number, lotRef: string) => demoId("lot", `${program}-${lotRef.toLowerCase()}`),
  intermediary: (n: number) => demoId("intermediary", n),
  property: (n: number) => demoId("prop", n),
  prospect: (n: number) => demoId("prospect", n),
  opportunity: (n: number) => demoId("opp", n),
  visit: (n: number) => demoId("visit", n),
  activity: (n: number) => demoId("activity", n),
  mandate: (n: number) => demoId("mandate", n),
  commission: (n: number) => demoId("commission", n),
};

async function upsertById<T>(
  delegate: { upsert: (args: { where: { id: string }; create: T; update: Partial<T> }) => Promise<unknown> },
  id: string,
  data: T
) {
  return delegate.upsert({ where: { id }, create: { ...data, id }, update: data });
}

// ---------------------------------------------------------------------------

async function seedUsers() {
  const password = process.env.DEMO_USER_PASSWORD;
  if (password !== undefined && password.length < 12) {
    throw new Error("DEMO_USER_PASSWORD doit contenir au moins 12 caractères.");
  }
  // Without DEMO_USER_PASSWORD the demo accounts get a random, never-printed
  // password: they exist for assignments/notifications but nobody can log in.
  const passwordHash = await bcrypt.hash(password ?? randomBytes(32).toString("hex"), 12);

  for (const user of demoUsers) {
    const id = ids.user(user.key as UserKey);
    await prisma.user.upsert({
      where: { id },
      create: { id, email: user.email, name: user.name, role: user.role, passwordHash },
      update: { email: user.email, name: user.name, role: user.role, ...(password ? { passwordHash } : {}) },
    });
  }
  return Boolean(password);
}

async function seedNetwork() {
  for (const o of demoOwners) {
    await upsertById(prisma.owner, ids.owner(o.n), {
      kind: o.kind,
      fullNameOrCompany: o.name,
      cinOrIce: o.cinOrIce,
      phone: fakePhone(100 + o.n),
      email: o.email,
      address: o.address,
      city: o.city,
      contactPreference: o.contactPreference,
      internalNotes: tagNote(o.notes),
      isActive: true,
    });
  }

  for (const p of demoPromoters) {
    await upsertById(prisma.promoter, ids.promoter(p.n), {
      companyName: p.company,
      mainContactName: p.contact,
      phone: fakePhone(200 + p.n),
      email: p.email,
      website: p.website,
      ice: p.ice,
      address: p.address,
      city: p.city,
      internalNotes: tagNote(p.notes),
      isActive: true,
    });
  }

  for (const program of demoPrograms) {
    await upsertById(prisma.developmentProgram, ids.program(program.n), {
      promoterId: ids.promoter(program.promoter),
      name: program.name,
      city: program.city,
      district: program.district,
      address: program.address,
      latitude: program.lat,
      longitude: program.lng,
      internalDescription: tagNote(program.description),
      status: program.status,
      expectedDeliveryDate: dayAt(program.deliveryInDays),
      indicativeLotCount: program.lotCount,
      isActive: true,
    });
    for (const lot of program.lots) {
      await upsertById(prisma.developmentLot, ids.lot(program.n, lot.ref), {
        programId: ids.program(program.n),
        reference: lot.ref,
        lotType: lot.lotType,
        typology: lot.typology,
        surface: lot.surface,
        price: dec(lot.price),
        status: lot.status,
        floor: lot.floor,
        block: lot.block,
        extraInfo: { source: DEMO_TAG },
      });
    }
  }

  for (const i of demoIntermediaries) {
    await upsertById(prisma.intermediary, ids.intermediary(i.n), {
      kind: i.kind,
      nameOrCompany: i.name,
      phone: fakePhone(300 + i.n),
      email: i.email,
      type: i.type,
      city: i.city,
      internalNotes: tagNote(i.notes),
      isActive: true,
    });
  }
}

function slugFor(title: string, n: number): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-demo-${String(n).padStart(2, "0")}`;
}

async function seedProperties() {
  const knownTags = new Set((await prisma.propertyTag.findMany({ select: { slug: true } })).map((t) => t.slug));
  const missingTags = new Set<string>();
  const directionId = ids.user("direction");

  for (const p of demoProperties) {
    const id = ids.property(p.n);
    const tags = p.tags.filter((slug) => {
      if (knownTags.has(slug)) return true;
      missingTags.add(slug);
      return false;
    });
    const sqmBase = p.type === "TERRAIN" ? p.landArea : p.livingArea;
    const pricePerSqm = p.transaction !== "LOCATION" && sqmBase ? Math.round(p.price / sqmBase) : null;
    const lot = p.program ? demoPrograms.find((prog) => prog.n === p.program!.program)!.lots.find((l) => l.ref === p.program!.lot) : undefined;

    const data = {
      reference: ref("NHA", p.n),
      slug: slugFor(p.title, p.n),
      titleFr: p.title,
      shortDescription: p.short,
      descriptionFr: p.description,
      transaction: p.transaction,
      propertyType: p.type,
      propertySubtype: p.subtype ?? null,
      status: p.status,
      publicationStatus: p.publication,
      visibility: p.visibility,
      city: p.city,
      district: p.district,
      addressPublic: p.addressPublic ?? null,
      latitude: p.lat,
      longitude: p.lng,
      proximityNotes: p.proximity ?? null,
      currency: "MAD",
      price: dec(p.price),
      priceOnRequest: p.priceOnRequest ?? false,
      pricePerSqm: dec(pricePerSqm),
      negotiable: p.negotiable ?? false,
      agencyFeePercent: dec(p.agencyFeePercent),
      monthlyCharges: dec(p.monthlyCharges),
      securityDeposit: dec(p.securityDeposit),
      estimatedYieldPercent: dec(p.yieldPercent),
      livingArea: p.livingArea ?? null,
      builtArea: p.builtArea ?? null,
      landArea: p.landArea ?? null,
      terraceArea: p.terraceArea ?? null,
      bedrooms: p.bedrooms ?? null,
      suites: p.suites ?? null,
      bathrooms: p.bathrooms ?? null,
      salons: p.salons ?? null,
      parkingSpaces: p.parking ?? null,
      floor: p.floor ?? null,
      totalFloors: p.totalFloors ?? null,
      yearBuilt: p.yearBuilt ?? null,
      furnished: p.furnished ?? null,
      condition: p.condition ?? null,
      orientation: p.orientation ?? null,
      availability: p.availability ?? null,
      isFeatured: p.featured ?? false,
      isGoodDeal: p.goodDeal ?? false,
      isCoupDeCoeur: p.coupDeCoeur ?? false,
      isExclusive: p.exclusive ?? false,
      isCreditEligible: p.credit ?? false,
      isMourabahaEligible: p.mourabaha ?? false,
      details: p.details as Prisma.InputJsonValue,
      publishedAt: p.publishedDaysAgo !== undefined && p.publication !== "BROUILLON" ? daysAgo(p.publishedDaysAgo) : null,
      archivedAt: p.archivedDaysAgo !== undefined ? daysAgo(p.archivedDaysAgo) : null,
      importSource: DEMO_TAG,
      sourceExternalId: id,
      createdById: directionId,
      updatedById: directionId,
      assignedToId: ids.user(p.agent),
      developmentProgramId: p.program ? ids.program(p.program.program) : null,
      developmentLotId: p.program && lot ? ids.lot(p.program.program, lot.ref) : null,
    };

    await prisma.property.upsert({
      where: { id },
      create: { ...data, id, tags: { connect: tags.map((slug) => ({ slug })) } },
      update: { ...data, tags: { set: tags.map((slug) => ({ slug })) } },
    });

    // Private data (ADMIN-only screen) — fictional, tagged with the demo source.
    const mainOwner = p.owners?.find((o) => o.main) ?? p.owners?.[0];
    const owner = mainOwner ? demoOwners.find((o) => o.n === mainOwner.owner)! : undefined;
    const mandate = demoMandates.find((m) => m.property === p.n);
    const privateData = {
      privateAddress: p.privateAddress ?? null,
      ownerName: owner?.name ?? null,
      ownerPhone: owner ? fakePhone(100 + owner.n) : null,
      ownerEmail: owner?.email ?? null,
      mandateReference: mandate ? ref("MAN", mandate.n) : null,
      mandateStartDate: mandate ? dayAt(mandate.startDay) : null,
      mandateEndDate: mandate ? dayAt(mandate.endDay) : null,
      minimumNetPrice: dec(p.minimumNetPrice),
      internalNotes: tagNote(p.internalNotes ?? "Bien de démonstration — données fictives."),
      source: DEMO_TAG,
    };
    await prisma.propertyPrivate.upsert({
      where: { propertyId: id },
      create: { ...privateData, id: demoId("private", p.n), propertyId: id },
      update: privateData,
    });

    for (const link of p.owners ?? []) {
      await upsertById(prisma.propertyOwner, demoId("propowner", `${p.n}-${link.owner}`), {
        propertyId: id,
        ownerId: ids.owner(link.owner),
        role: link.role,
        quoteShare: dec(link.share),
        isMainContact: link.main ?? false,
      });
    }
    for (const link of p.intermediaries ?? []) {
      await upsertById(prisma.propertyIntermediary, demoId("propinter", `${p.n}-${link.intermediary}`), {
        propertyId: id,
        intermediaryId: ids.intermediary(link.intermediary),
        role: link.role,
        note: link.note,
        commissionType: link.commissionRate !== undefined ? "POURCENTAGE" : link.commissionAmount !== undefined ? "FORFAIT" : null,
        commissionRate: dec(link.commissionRate),
        commissionAmount: dec(link.commissionAmount),
      });
    }
  }

  if (missingTags.size > 0) {
    console.warn(`  ! Tags absents de PropertyTag (lancez d'abord \`pnpm db:seed\`) : ${[...missingTags].join(", ")}`);
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function seedMedia(): Promise<number> {
  let generated = 0;
  const uploaderId = ids.user("direction");

  for (const p of demoProperties) {
    if (!p.images || !p.palette) continue;
    const propertyId = ids.property(p.n);

    for (let i = 0; i < p.images; i += 1) {
      const mediaId = demoId("media", `${String(p.n).padStart(2, "0")}-${i + 1}`);
      const storageKey = `${propertyId}/${mediaId}`;
      const dir = path.join(MEDIA_STORAGE_ROOT, storageKey);

      const existing = await prisma.propertyMedia.findUnique({ where: { id: mediaId }, select: { id: true } });
      if (existing && (await fileExists(path.join(dir, "master.jpg"))) && (await fileExists(path.join(dir, "card.webp")))) continue;

      const image = await renderDemoImage(p.type, p.palette, i);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "master.jpg"), image.master);
      for (const [variant, buffer] of Object.entries(image.variants) as [MediaVariant, Buffer][]) {
        await writeFile(path.join(dir, `${variant}.webp`), buffer);
      }

      const data = {
        propertyId,
        type: "IMAGE" as const,
        originalFilename: `demo-${String(p.n).padStart(2, "0")}-${i + 1}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: image.master.length,
        width: image.width,
        height: image.height,
        // Keyed on the media id rather than the pixels so a re-render never trips @@unique([propertyId, checksum]).
        checksum: createHash("sha256").update(`${DEMO_TAG}:${mediaId}`).digest("hex"),
        storageKey,
        sortOrder: i,
        isCover: i === 0,
        altText: `${p.title} — illustration de démonstration`,
        uploadedById: uploaderId,
      };
      await upsertById(prisma.propertyMedia, mediaId, data);
      generated += 1;
    }
  }
  return generated;
}

async function seedProspects() {
  const directionId = ids.user("direction");
  for (const p of demoProspects) {
    const id = ids.prospect(p.n);
    await upsertById(prisma.prospect, id, {
      reference: ref("PRO", p.n),
      type: p.type,
      kind: p.kind ?? "PHYSIQUE",
      firstName: p.firstName ?? null,
      lastName: p.lastName ?? null,
      companyName: p.companyName ?? null,
      phone: fakePhone(1000 + p.n),
      email: p.email,
      preferredLanguage: p.language ?? "FR",
      source: p.source,
      status: p.status,
      searchCities: p.cities,
      searchDistricts: p.districts ?? [],
      searchPropertyTypes: p.types,
      searchTransaction: p.transaction ?? null,
      budgetMin: dec(p.budgetMin),
      budgetMax: dec(p.budgetMax),
      currency: "MAD",
      projectTimeline: p.timeline ?? null,
      internalNotes: tagNote(p.notes),
      formOrigin: p.formOrigin ?? null,
      // A public-form demande has no back-office creator, same as lib/crm/public-request-actions.ts.
      createdById: p.formOrigin ? null : directionId,
      assignedToId: p.agent ? ids.user(p.agent) : null,
      createdAt: daysAgo(p.createdDaysAgo),
    });

    for (const interest of p.interests ?? []) {
      await upsertById(prisma.prospectPropertyInterest, demoId("interest", `${p.n}-${interest.property}`), {
        prospectId: id,
        propertyId: ids.property(interest.property),
        interestLevel: interest.level,
        internalNote: interest.note ?? null,
      });
    }
  }
}

/** Plausible stage journey ending at the opportunity's current stage. */
function stagePath(o: DemoOpportunity): OpportunityStage[] {
  if (o.stage === "GAGNEE") {
    return o.transaction === "LOCATION"
      ? ["NOUVELLE", "QUALIFICATION", "VISITE", "OFFRE", "GAGNEE"]
      : ["NOUVELLE", "QUALIFICATION", "VISITE", "OFFRE", "NEGOCIATION", "COMPROMIS", "ACTE", "GAGNEE"];
  }
  if (o.stage === "PERDUE") return ["NOUVELLE", "QUALIFICATION", "VISITE", "OFFRE", "PERDUE"];
  const optional = new Set<OpportunityStage>(["MATCHING", "RESERVATION", "FINANCEMENT", "NEGOCIATION"]);
  const upTo = opportunityStageValues.slice(0, opportunityStageValues.indexOf(o.stage) + 1);
  return upTo.filter((stage) => stage === o.stage || !optional.has(stage) || (o.stage === "COMPROMIS" && stage === "NEGOCIATION"));
}

async function seedOpportunities() {
  for (const o of demoOpportunities) {
    const id = ids.opportunity(o.n);
    const createdAt = daysAgo(o.createdDaysAgo);
    const closedAt = o.closedDaysAgo !== undefined ? daysAgo(o.closedDaysAgo) : null;
    const path_ = stagePath(o);
    const lastChange = closedAt ?? daysAgo(Math.max(o.lastActivityDaysAgo, 1));
    const step = path_.length > 1 ? (lastChange.getTime() - createdAt.getTime()) / (path_.length - 1) : 0;
    const history = path_.map((stage, index) => ({ stage, at: new Date(createdAt.getTime() + step * index) }));

    await upsertById(prisma.opportunity, id, {
      reference: ref("OPP", o.n),
      prospectId: ids.prospect(o.prospect),
      propertyId: o.property ? ids.property(o.property) : null,
      transaction: o.transaction,
      title: o.title,
      stage: o.stage,
      estimatedAmount: dec(o.estimatedAmount),
      finalAmount: dec(o.finalAmount),
      currency: "MAD",
      probability: defaultStageProbability[o.stage],
      probabilityIsManual: false,
      expectedCloseDate: closedAt ?? (o.closeInDays !== undefined ? dayAt(o.closeInDays, 12) : null),
      closedAt,
      lossReason: o.lossReason ?? null,
      lossNote: o.lossNote ?? null,
      internalNote: tagNote(o.note ?? "Opportunité de démonstration."),
      assignedToId: ids.user(o.agent),
      createdById: ids.user("direction"),
      lastActivityAt: daysAgo(o.lastActivityDaysAgo),
      stageChangedAt: history[history.length - 1].at,
      createdAt,
    });

    // The journal is append-only in the app; for the demo it is simply rebuilt.
    await prisma.opportunityStageHistory.deleteMany({ where: { opportunityId: id } });
    await prisma.opportunityStageHistory.createMany({
      data: history.map((entry, index) => ({
        id: demoId("opphist", `${o.n}-${index + 1}`),
        opportunityId: id,
        fromStage: index === 0 ? null : history[index - 1].stage,
        toStage: entry.stage,
        changedById: ids.user(index === 0 ? "direction" : o.agent),
        createdAt: entry.at,
      })),
    });
  }
}

async function seedVisits() {
  for (const v of demoVisits) {
    const start = dayAt(v.day, v.hour);
    await upsertById(prisma.visit, ids.visit(v.n), {
      reference: ref("VIS", v.n),
      propertyId: ids.property(v.property),
      prospectId: ids.prospect(v.prospect),
      assignedToId: ids.user(v.agent),
      scheduledStart: start,
      scheduledEnd: new Date(start.getTime() + 60 * 60 * 1000),
      status: v.status,
      type: v.type,
      participantsCount: v.participants ?? null,
      preVisitNote: v.preNote ?? null,
      prospectFeedback: v.feedback ?? null,
      internalNote: tagNote(v.internalNote ?? "Visite de démonstration."),
      postVisitInterest: v.postInterest ?? null,
      nextFollowUpAt: v.followUpInDays !== undefined ? dayAt(v.followUpInDays, 15) : null,
      opportunityId: v.opportunity ? ids.opportunity(v.opportunity) : null,
      createdById: ids.user(v.agent),
    });
  }
}

async function seedActivities() {
  for (const a of demoActivities) {
    const done = a.status === "TERMINEE" && a.doneDay !== undefined ? dayAt(a.doneDay, 17) : null;
    await upsertById(prisma.activity, ids.activity(a.n), {
      prospectId: ids.prospect(a.prospect),
      propertyId: a.property ? ids.property(a.property) : null,
      visitId: a.visit ? ids.visit(a.visit) : null,
      opportunityId: a.opportunity ? ids.opportunity(a.opportunity) : null,
      type: a.type,
      title: a.title,
      content: tagNote(a.content ?? "Action de démonstration."),
      dueAt: a.dueDay !== undefined ? dayAt(a.dueDay, a.dueHour ?? 10) : done,
      completedAt: done,
      status: a.status,
      assignedToId: ids.user(a.agent),
      createdById: ids.user(a.agent),
      createdAt: done ?? daysAgo(1),
    });
  }
}

async function seedNotifications() {
  for (const n of demoNotifications) {
    const refFor = n.activity
      ? ref("PRO", demoActivities.find((a) => a.n === n.activity)!.prospect)
      : n.visit
        ? ref("VIS", n.visit)
        : n.opportunity
          ? ref("OPP", n.opportunity)
          : ref("PRO", n.prospect!);
    const activity = n.activity ? demoActivities.find((a) => a.n === n.activity)! : undefined;
    const createdAt = new Date(now.getTime() - n.hoursAgo * 60 * 60 * 1000);

    await upsertById(prisma.notification, demoId("notif", n.n), {
      userId: ids.user(n.user),
      type: n.type,
      title: n.title,
      message: n.message.replace("{ref}", refFor),
      prospectId: n.prospect ? ids.prospect(n.prospect) : activity ? ids.prospect(activity.prospect) : null,
      visitId: n.visit ? ids.visit(n.visit) : null,
      activityId: n.activity ? ids.activity(n.activity) : null,
      opportunityId: n.opportunity ? ids.opportunity(n.opportunity) : null,
      isRead: n.read ?? false,
      readAt: n.read ? createdAt : null,
      createdAt,
    });
  }
}

async function seedFinance() {
  const directionId = ids.user("direction");

  for (const m of demoMandates) {
    await upsertById(prisma.mandate, ids.mandate(m.n), {
      reference: ref("MAN", m.n),
      propertyId: ids.property(m.property),
      ownerId: ids.owner(m.owner),
      type: m.type,
      status: m.status,
      startDate: dayAt(m.startDay, 0),
      endDate: dayAt(m.endDay, 0),
      isExclusive: m.exclusive,
      displayedPrice: dec(m.displayedPrice),
      agreedNetSellerPrice: dec(m.netSellerPrice),
      internalConditions: tagNote(m.conditions),
      createdById: directionId,
    });
  }

  for (const c of demoCommissions) {
    const caseId = ids.commission(c.n);
    await upsertById(prisma.commissionCase, caseId, {
      reference: ref("COM", c.n),
      propertyId: ids.property(c.property),
      mandateId: c.mandate ? ids.mandate(c.mandate) : null,
      opportunityId: c.opportunity ? ids.opportunity(c.opportunity) : null,
      transaction: c.transaction,
      status: c.status,
      basis: c.basis,
      baseAmount: new Prisma.Decimal(c.baseAmount),
      agencyCommissionRate: dec(c.rate),
      agencyCommissionAmount: new Prisma.Decimal(c.amount),
      billedTo: c.billedTo,
      currency: "MAD",
      finalTransactionAmount: dec(c.finalAmount),
      expectedCollectionDate: c.expectedDay !== undefined ? dayAt(c.expectedDay, 0) : null,
      internalNotes: tagNote(c.notes),
      createdById: directionId,
    });

    for (const s of c.shares) {
      const computed = s.mode === "POURCENTAGE" ? Math.round(((c.amount * s.value) / 100) * 100) / 100 : s.value;
      await upsertById(prisma.commissionShare, demoId("share", `${c.n}-${s.n}`), {
        commissionCaseId: caseId,
        beneficiaryType: s.beneficiary,
        intermediaryId: s.intermediary ? ids.intermediary(s.intermediary) : null,
        userId: s.agent ? ids.user(s.agent) : null,
        freeBeneficiaryName: null,
        mode: s.mode,
        value: new Prisma.Decimal(s.value),
        computedAmount: new Prisma.Decimal(computed),
        status: s.status,
        notes: tagNote(s.notes ?? "Répartition de démonstration."),
      });
    }

    for (const p of c.payments) {
      await upsertById(prisma.commissionPayment, demoId("payment", `${c.n}-${p.n}`), {
        commissionCaseId: caseId,
        commissionShareId: p.share ? demoId("share", `${c.n}-${p.share}`) : null,
        amount: new Prisma.Decimal(p.amount),
        expectedDate: p.expectedDay !== undefined ? dayAt(p.expectedDay, 0) : null,
        paidDate: p.paidDay !== undefined ? dayAt(p.paidDay, 0) : null,
        status: p.status,
        internalReference: `DEMO-PAY-${c.n}-${p.n}`,
        paymentMethod: p.method ?? null,
        internalNote: tagNote(p.note ?? "Paiement de démonstration."),
      });
    }
  }
}

async function main() {
  const host = assertLocalDatabase();
  console.log(`Chargement des données de démonstration ${DEMO_TAG} (base : ${host})…`);

  const canLogIn = await seedUsers();
  console.log(`  ✓ ${demoUsers.length} utilisateurs de démo${canLogIn ? " (mot de passe : DEMO_USER_PASSWORD)" : " (connexion désactivée — définir DEMO_USER_PASSWORD pour l'activer)"}`);
  await seedNetwork();
  console.log(`  ✓ Réseau : ${demoOwners.length} propriétaires, ${demoPromoters.length} promoteurs, ${demoPrograms.length} programmes, ${demoIntermediaries.length} intermédiaires`);
  await seedProperties();
  const generated = await seedMedia();
  console.log(`  ✓ ${demoProperties.length} biens (${generated} photo(s) de démonstration générée(s))`);
  await seedProspects();
  await seedOpportunities();
  await seedVisits();
  await seedActivities();
  await seedNotifications();
  console.log(
    `  ✓ CRM : ${demoProspects.length} prospects, ${demoOpportunities.length} opportunités, ${demoVisits.length} visites, ${demoActivities.length} actions, ${demoNotifications.length} notifications`
  );
  await seedFinance();
  console.log(`  ✓ Finance : ${demoMandates.length} mandats, ${demoCommissions.length} dossiers de commission`);
  console.log(`Terminé. Supprimer ces données : pnpm db:clear:demo`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
