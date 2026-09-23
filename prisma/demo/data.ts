/**
 * Local demo dataset for NA Business Africa — 100 % fictional.
 *
 * No real person, company, phone number or e-mail address: every e-mail is
 * on the reserved `example.test` domain (RFC 2606) and every phone number
 * uses the obviously-unallocated `+212 6 00 00 xx xx` pattern. Ids are
 * resolved to deterministic `demona-…` ids by prisma/demo/seed-demo.ts, and
 * every date is expressed relative to the moment the seed runs (days from
 * today) so relances "aujourd'hui / en retard / à venir" stay meaningful on
 * every re-run.
 */
import type {
  ActivityStatus,
  ActivityType,
  CommissionBasis,
  CommissionBeneficiaryType,
  CommissionBilledTo,
  CommissionCaseStatus,
  CommissionPaymentStatus,
  CommissionShareMode,
  CommissionShareStatus,
  ContactPreference,
  FurnishedState,
  InterestLevel,
  IntermediaryType,
  LotStatus,
  MandateStatus,
  MandateType,
  NotificationType,
  OpportunityLossReason,
  OpportunityStage,
  Orientation,
  PartyKind,
  PostVisitInterest,
  ProgramStatus,
  PropertyAvailability,
  PropertyCondition,
  PropertyOwnerRole,
  PropertyStatus,
  PropertyTransaction,
  PropertyType,
  ProspectFormOrigin,
  ProspectLanguage,
  ProspectSource,
  ProspectStatus,
  ProspectType,
  PublicationStatus,
  Role,
  VisitStatus,
  VisitType,
} from "../../lib/generated/prisma/enums";

/** Clearly non-real Moroccan mobile number: +212 6 00 00 xx xx. */
export function fakePhone(n: number): string {
  const s = String(n).padStart(4, "0");
  return `+212 6 00 00 ${s.slice(0, 2)} ${s.slice(2)}`;
}

// ---------------------------------------------------------------------------
// Demo back-office users (the existing admin accounts are never touched)
// ---------------------------------------------------------------------------

export type DemoUser = { key: string; email: string; name: string; role: Role };

export const demoUsers: DemoUser[] = [
  { key: "direction", email: "direction.demo@example.test", name: "Amina Rahmani (démo)", role: "ADMIN" },
  { key: "yassine", email: "yassine.kettani.demo@example.test", name: "Yassine Kettani (démo)", role: "AGENT" },
  { key: "salma", email: "salma.ouazzani.demo@example.test", name: "Salma Ouazzani (démo)", role: "AGENT" },
  { key: "karim", email: "karim.fassi.demo@example.test", name: "Karim Fassi (démo)", role: "AGENT" },
];
export type UserKey = "direction" | "yassine" | "salma" | "karim";

// ---------------------------------------------------------------------------
// Real-estate network
// ---------------------------------------------------------------------------

export type DemoOwner = {
  n: number;
  kind: PartyKind;
  name: string;
  cinOrIce: string;
  email: string;
  address: string;
  city: string;
  contactPreference: ContactPreference;
  notes: string;
};

export const demoOwners: DemoOwner[] = [
  { n: 1, kind: "PHYSIQUE", name: "Hicham Berrada", cinOrIce: "DEMO-CIN-0001", email: "hicham.berrada@example.test", address: "Boulevard fictif 12, Anfa", city: "Casablanca", contactPreference: "TELEPHONE", notes: "Vend pour s'installer à Rabat. Souhaite une vente discrète, pas de panneau." },
  { n: 2, kind: "PHYSIQUE", name: "Nadia Tazi", cinOrIce: "DEMO-CIN-0002", email: "nadia.tazi@example.test", address: "Rue fictive 4, Maârif", city: "Casablanca", contactPreference: "WHATSAPP", notes: "Propriétaire de deux biens confiés à l'agence. Très réactive sur WhatsApp." },
  { n: 3, kind: "PHYSIQUE", name: "Omar Chraibi", cinOrIce: "DEMO-CIN-0003", email: "omar.chraibi@example.test", address: "Derb fictif 8, Mouassine", city: "Marrakech", contactPreference: "TELEPHONE", notes: "Riad hérité, restauré en 2019. Ouvert à la négociation si signature rapide." },
  { n: 4, kind: "SOCIETE", name: "SCI Atlas Patrimoine (démo)", cinOrIce: "DEMO-ICE-000000000004", email: "contact@atlas-patrimoine.example.test", address: "Immeuble fictif, Twin Center", city: "Casablanca", contactPreference: "EMAIL", notes: "Foncière familiale. Tous les dossiers passent par le gérant, jamais d'annonce publique." },
  { n: 5, kind: "PHYSIQUE", name: "Sophie Marchand", cinOrIce: "DEMO-PASS-0005", email: "sophie.marchand@example.test", address: "Circuit fictif de la Palmeraie", city: "Marrakech", contactPreference: "EMAIL", notes: "Résidente à l'étranger une partie de l'année. Préférer les échanges par e-mail." },
  { n: 6, kind: "PHYSIQUE", name: "Youssef Alaoui", cinOrIce: "DEMO-CIN-0006", email: "youssef.alaoui@example.test", address: "Avenue fictive 21, Malabata", city: "Tanger", contactPreference: "WHATSAPP", notes: "Investisseur local, possède plusieurs lots à Tanger." },
  { n: 7, kind: "SOCIETE", name: "Rabat Office Invest (démo)", cinOrIce: "DEMO-ICE-000000000007", email: "gestion@rabat-office.example.test", address: "Technopolis fictif, Hay Riad", city: "Rabat", contactPreference: "EMAIL", notes: "Société patrimoniale de bureaux. Interlocuteur : directeur administratif." },
  { n: 8, kind: "PHYSIQUE", name: "Karima Idrissi", cinOrIce: "DEMO-CIN-0008", email: "karima.idrissi@example.test", address: "Quartier fictif, Diabat", city: "Essaouira", contactPreference: "TELEPHONE", notes: "Biens à Essaouira et Agadir. Disponible le matin uniquement." },
];

export type DemoPromoter = { n: number; company: string; contact: string; email: string; website: string; ice: string; city: string; address: string; notes: string };

export const demoPromoters: DemoPromoter[] = [
  { n: 1, company: "Atlas Horizon Immobilier (démo)", contact: "Rachida Amrani", email: "commercial@atlas-horizon.example.test", website: "https://atlas-horizon.example.test", ice: "DEMO-ICE-100000000001", city: "Agadir", address: "Zone fictive, Founty", notes: "Partenaire historique sur Agadir. Grille de prix mise à jour chaque trimestre." },
  { n: 2, company: "Détroit Développement (démo)", contact: "Samir Benali", email: "ventes@detroit-dev.example.test", website: "https://detroit-dev.example.test", ice: "DEMO-ICE-100000000002", city: "Tanger", address: "Boulevard fictif, Tanger Marina", notes: "Livraison tranche 1 prévue fin 2027." },
  { n: 3, company: "Anfa Premium Promotion (démo)", contact: "Ghita Sefrioui", email: "contact@anfa-premium.example.test", website: "https://anfa-premium.example.test", ice: "DEMO-ICE-100000000003", city: "Casablanca", address: "Avenue fictive, Anfa", notes: "Programme haut de gamme, commercialisation sur rendez-vous uniquement." },
  { n: 4, company: "Rabat Green Living (démo)", contact: "Ali Bennouna", email: "info@rabat-green.example.test", website: "https://rabat-green.example.test", ice: "DEMO-ICE-100000000004", city: "Rabat", address: "Avenue fictive, Souissi", notes: "Premier contact en cours : programme éco-résidentiel en phase d'étude, pas encore de lots." },
];

export type DemoLot = { ref: string; lotType: string; typology: string; surface: number; price: number; status: LotStatus; floor: string; block: string };
export type DemoProgram = {
  n: number;
  promoter: number;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  status: ProgramStatus;
  deliveryInDays: number;
  lotCount: number;
  lots: DemoLot[];
};

export const demoPrograms: DemoProgram[] = [
  {
    n: 1, promoter: 1, name: "Les Terrasses de Founty", city: "Agadir", district: "Founty", address: "Front de mer fictif, Founty",
    lat: 30.4015, lng: -9.5868, description: "Résidence de 64 appartements à 300 m de la plage, piscine commune et conciergerie.",
    status: "COMMERCIALISATION", deliveryInDays: 420, lotCount: 64,
    lots: [
      { ref: "A-12", lotType: "Appartement", typology: "T3", surface: 98, price: 1_650_000, status: "RESERVE", floor: "2", block: "A" },
      { ref: "A-14", lotType: "Appartement", typology: "T2", surface: 72, price: 1_190_000, status: "DISPONIBLE", floor: "2", block: "A" },
      { ref: "B-03", lotType: "Appartement", typology: "T4", surface: 128, price: 2_150_000, status: "OPTIONNE", floor: "RDC", block: "B" },
      { ref: "B-21", lotType: "Penthouse", typology: "T4", surface: 156, price: 3_100_000, status: "VENDU", floor: "5", block: "B" },
    ],
  },
  {
    n: 2, promoter: 2, name: "Marina Bay Résidences", city: "Tanger", district: "Tanger Marina", address: "Quai fictif, Tanger Marina",
    lat: 35.7858, lng: -5.8045, description: "Deux tours vue détroit, commerces en pied d'immeuble, parking en sous-sol.",
    status: "COMMERCIALISATION", deliveryInDays: 520, lotCount: 120,
    lots: [
      { ref: "T1-0804", lotType: "Appartement", typology: "T3", surface: 104, price: 1_980_000, status: "DISPONIBLE", floor: "8", block: "Tour 1" },
      { ref: "T1-1102", lotType: "Appartement", typology: "T2", surface: 76, price: 1_420_000, status: "OPTIONNE", floor: "11", block: "Tour 1" },
      { ref: "T2-0305", lotType: "Appartement", typology: "T3", surface: 99, price: 1_760_000, status: "VENDU", floor: "3", block: "Tour 2" },
      { ref: "T2-RDC-C2", lotType: "Commerce", typology: "Local", surface: 85, price: 2_300_000, status: "DISPONIBLE", floor: "RDC", block: "Tour 2" },
    ],
  },
  {
    n: 3, promoter: 3, name: "Les Jardins d'Anfa", city: "Casablanca", district: "Anfa", address: "Allée fictive, Anfa",
    lat: 33.5862, lng: -7.6391, description: "Petit collectif de 28 appartements autour d'un jardin paysager, livraison 2028.",
    status: "COMMERCIALISATION", deliveryInDays: 700, lotCount: 28,
    lots: [
      { ref: "J-101", lotType: "Appartement", typology: "T3", surface: 118, price: 2_750_000, status: "DISPONIBLE", floor: "1", block: "Jardin" },
      { ref: "J-204", lotType: "Appartement", typology: "T4", surface: 152, price: 3_650_000, status: "RESERVE", floor: "2", block: "Jardin" },
      { ref: "J-PH1", lotType: "Penthouse", typology: "T5", surface: 210, price: 6_400_000, status: "OPTIONNE", floor: "4", block: "Jardin" },
    ],
  },
];

export type DemoIntermediary = { n: number; kind: PartyKind; name: string; email: string; type: IntermediaryType; city: string; notes: string };

export const demoIntermediaries: DemoIntermediary[] = [
  { n: 1, kind: "PHYSIQUE", name: "Mehdi Lahlou", email: "mehdi.lahlou@example.test", type: "APPORTEUR", city: "Casablanca", notes: "Apporteur d'affaires, réseau de chefs d'entreprise à Casablanca." },
  { n: 2, kind: "SOCIETE", name: "Palmeraie Conseil (démo)", email: "contact@palmeraie-conseil.example.test", type: "AGENCE_PARTENAIRE", city: "Marrakech", notes: "Agence partenaire, partage d'honoraires 40/60 sur les biens de la médina." },
  { n: 3, kind: "SOCIETE", name: "CrédiPlus Courtage (démo)", email: "dossiers@crediplus.example.test", type: "COURTIER", city: "Casablanca", notes: "Courtier en crédit immobilier, accompagne les acquéreurs sur le financement." },
  { n: 4, kind: "PHYSIQUE", name: "Maître Salma Bennis (démo)", email: "etude.bennis@example.test", type: "NOTAIRE", city: "Rabat", notes: "Notaire habituelle pour les transactions à Rabat." },
  { n: 5, kind: "SOCIETE", name: "Nordline Immobilier (démo)", email: "agence@nordline.example.test", type: "AGENCE_PARTENAIRE", city: "Tanger", notes: "Agence partenaire pour le nord du Royaume." },
];

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export type DemoProperty = {
  n: number;
  title: string;
  short: string;
  description: string;
  transaction: PropertyTransaction;
  type: PropertyType;
  subtype?: string;
  status: PropertyStatus;
  publication: PublicationStatus;
  visibility: "PUBLIC" | "OFF_MARKET";
  city: string;
  district: string | null;
  addressPublic?: string;
  lat: number | null;
  lng: number | null;
  proximity?: string;
  price: number;
  priceOnRequest?: boolean;
  negotiable?: boolean;
  agencyFeePercent?: number;
  monthlyCharges?: number;
  securityDeposit?: number;
  yieldPercent?: number;
  livingArea?: number;
  builtArea?: number;
  landArea?: number;
  terraceArea?: number;
  bedrooms?: number;
  suites?: number;
  bathrooms?: number;
  salons?: number;
  parking?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  furnished?: FurnishedState;
  condition?: PropertyCondition;
  orientation?: Orientation;
  availability?: PropertyAvailability;
  featured?: boolean;
  goodDeal?: boolean;
  coupDeCoeur?: boolean;
  exclusive?: boolean;
  credit?: boolean;
  mourabaha?: boolean;
  details: Record<string, unknown>;
  tags: string[];
  agent: UserKey;
  program?: { program: number; lot: string };
  owners?: { owner: number; role: PropertyOwnerRole; share?: number; main?: boolean }[];
  intermediaries?: { intermediary: number; role: IntermediaryType; note: string; commissionRate?: number; commissionAmount?: number }[];
  privateAddress?: string;
  minimumNetPrice?: number;
  internalNotes?: string;
  /** Number of generated demo photos (only for PUBLIC/PUBLIE biens). */
  images?: number;
  palette?: [string, string, string];
  publishedDaysAgo?: number;
  archivedDaysAgo?: number;
};

export const demoProperties: DemoProperty[] = [
  // --- 8 PUBLIC / PUBLIE, with demo photos ---------------------------------
  {
    n: 1, title: "Villa contemporaine avec piscine à Anfa", short: "Villa d'architecte de 480 m² sur 1 100 m² de terrain, piscine chauffée et jardin paysager.",
    description: "Au cœur d'Anfa, cette villa contemporaine offre de très beaux volumes baignés de lumière : double séjour ouvert sur le jardin, cuisine équipée, cinq chambres dont une suite parentale avec dressing, salle de sport et piscine chauffée. Domotique, climatisation réversible et garage deux voitures. Environnement résidentiel calme, proche des écoles internationales.",
    transaction: "VENTE", type: "VILLA", subtype: "Villa contemporaine", status: "DISPONIBLE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Casablanca", district: "Anfa", addressPublic: "Anfa, Casablanca", lat: 33.5891, lng: -7.6452, proximity: "Écoles internationales à 5 min, Anfa Place à 8 min.",
    price: 14_500_000, negotiable: true, agencyFeePercent: 2.5, livingArea: 480, builtArea: 520, landArea: 1100, terraceArea: 90,
    bedrooms: 5, suites: 2, bathrooms: 5, salons: 2, parking: 2, totalFloors: 2, yearBuilt: 2018, furnished: "NON_MEUBLE", condition: "EXCELLENT", orientation: "SUD",
    availability: "IMMEDIATE", featured: true, exclusive: true, credit: true,
    details: { kind: "villa-maison-riad", pool: true, garden: true, outbuildings: true, rooftop: false, view: "Jardin et piscine", fireplace: true, hammam: true },
    tags: ["piscine", "jardin", "domotique", "climatisation", "residentiel", "calme", "proche-ecole", "exclusivite", "titre"],
    agent: "yassine", owners: [{ owner: 1, role: "PROPRIETAIRE", share: 100, main: true }],
    intermediaries: [{ intermediary: 1, role: "APPORTEUR", note: "A présenté le propriétaire à l'agence.", commissionRate: 10 }],
    privateAddress: "Villa fictive n° 7, rue imaginaire, Anfa", minimumNetPrice: 13_600_000, internalNotes: "Propriétaire pressé mais ferme sous 13,6 M MAD net vendeur.",
    images: 3, palette: ["#f4d9b8", "#e9c46a", "#2a9d8f"], publishedDaysAgo: 40,
  },
  {
    n: 2, title: "Appartement vue mer à Aïn Diab", short: "Trois chambres, grande terrasse face à l'océan, résidence sécurisée avec piscine.",
    description: "Dans une résidence récente de la corniche, appartement traversant de 165 m² avec une terrasse de 35 m² face à l'océan. Séjour lumineux, cuisine américaine, trois chambres dont une suite, deux salles de bains. Résidence gardée 24h/24, piscine commune, deux places de parking en sous-sol.",
    transaction: "VENTE", type: "APPARTEMENT", subtype: "Appartement traversant", status: "RESERVE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Casablanca", district: "Aïn Diab", addressPublic: "Corniche, Aïn Diab", lat: 33.5923, lng: -7.6861, proximity: "Plage à 2 min à pied, Morocco Mall à 5 min.",
    price: 3_850_000, negotiable: true, agencyFeePercent: 2.5, monthlyCharges: 1_200, livingArea: 165, terraceArea: 35,
    bedrooms: 3, suites: 1, bathrooms: 2, salons: 1, parking: 2, floor: 4, totalFloors: 6, yearBuilt: 2020, furnished: "SEMI_MEUBLE", condition: "EXCELLENT", orientation: "OUEST",
    availability: "SOUS_3_MOIS", credit: true, mourabaha: true,
    details: { kind: "appartement-duplex-penthouse", residenceName: "Résidence Océane (fictive)", elevator: true, floorPosition: "intermediaire", terrace: true, concierge: true, parkingIncluded: true },
    tags: ["vue-mer", "terrasse", "residence-securisee", "piscine", "proche-mer", "climatisation", "titre"],
    agent: "yassine", owners: [{ owner: 2, role: "PROPRIETAIRE", share: 100, main: true }],
    intermediaries: [{ intermediary: 3, role: "COURTIER", note: "Accompagne l'acquéreur sur le financement." }],
    privateAddress: "Appartement 12, résidence fictive, Aïn Diab", minimumNetPrice: 3_650_000, internalNotes: "Sous compromis — ne plus programmer de visites.",
    images: 3, palette: ["#bde0fe", "#a2d2ff", "#264653"], publishedDaysAgo: 55,
  },
  {
    n: 3, title: "Riad restauré avec patio et rooftop, médina", short: "Riad de six chambres entièrement restauré, patio arboré, piscine et terrasse panoramique.",
    description: "À quelques minutes de la place Jemaa el-Fna, ce riad restauré avec des artisans marrakchis marie zellige, tadelakt et bois de cèdre. Patio arboré avec bassin, six chambres avec salle de bains, salon marocain, hammam traditionnel et rooftop avec vue sur l'Atlas. Idéal résidence secondaire ou maison d'hôtes.",
    transaction: "VENTE", type: "RIAD", subtype: "Riad traditionnel", status: "DISPONIBLE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Marrakech", district: "Médina", addressPublic: "Mouassine, Médina", lat: 31.6296, lng: -7.9921, proximity: "Jemaa el-Fna à 7 min à pied, parking public à 3 min.",
    price: 6_200_000, negotiable: true, agencyFeePercent: 3, livingArea: 380, landArea: 210, terraceArea: 120,
    bedrooms: 6, suites: 6, bathrooms: 6, salons: 2, totalFloors: 3, yearBuilt: 1920, furnished: "MEUBLE", condition: "EXCELLENT",
    availability: "IMMEDIATE", coupDeCoeur: true, yieldPercent: 6.5,
    details: { kind: "villa-maison-riad", pool: true, garden: false, outbuildings: false, rooftop: true, view: "Atlas et toits de la médina", fireplace: true, hammam: true },
    tags: ["patio", "rooftop", "hammam", "medina", "vue-medina", "maison-hotes-autorisee", "piscine"],
    agent: "salma", owners: [{ owner: 3, role: "PROPRIETAIRE", share: 100, main: true }],
    intermediaries: [{ intermediary: 2, role: "AGENCE_PARTENAIRE", note: "Co-mandat, partage 40/60.", commissionRate: 40 }],
    privateAddress: "Derb fictif n° 8, Mouassine", minimumNetPrice: 5_700_000, internalNotes: "Mandat arrive à échéance — à renouveler avant la fin du mois.",
    images: 3, palette: ["#f7c59f", "#e76f51", "#6b4226"], publishedDaysAgo: 70,
  },
  {
    n: 4, title: "Villa avec jardin à louer, Palmeraie", short: "Villa meublée de quatre suites sur 3 000 m² de jardin, piscine et pool-house.",
    description: "Dans un domaine sécurisé de la Palmeraie, villa meublée avec goût : grand salon avec cheminée, salle à manger, quatre suites, piscine de 12 m avec pool-house et jardin planté d'oliviers. Personnel de maison possible. Location longue durée.",
    transaction: "LOCATION", type: "VILLA", subtype: "Villa de standing", status: "DISPONIBLE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Marrakech", district: "Palmeraie", addressPublic: "Palmeraie, Marrakech", lat: 31.6712, lng: -7.9703, proximity: "Golf à 10 min, aéroport à 25 min.",
    price: 38_000, securityDeposit: 76_000, livingArea: 350, landArea: 3000, terraceArea: 80,
    bedrooms: 4, suites: 4, bathrooms: 5, salons: 2, parking: 4, totalFloors: 1, yearBuilt: 2012, furnished: "MEUBLE", condition: "BON_ETAT", orientation: "SUD_EST",
    availability: "SOUS_1_MOIS", featured: true,
    details: { kind: "villa-maison-riad", pool: true, garden: true, outbuildings: true, rooftop: false, view: "Jardin et palmiers", fireplace: true, hammam: false },
    tags: ["piscine", "jardin", "gardien", "calme", "proche-golf", "cheminee", "wifi"],
    agent: "salma", owners: [{ owner: 5, role: "PROPRIETAIRE", share: 100, main: true }],
    privateAddress: "Domaine fictif, lot 14, Palmeraie", internalNotes: "Loyer négociable pour un bail de 2 ans minimum.",
    images: 3, palette: ["#fefae0", "#dda15e", "#606c38"], publishedDaysAgo: 18,
  },
  {
    n: 5, title: "Appartement vue baie à Malabata", short: "Deux chambres, terrasse vue sur la baie de Tanger, résidence avec piscine.",
    description: "Appartement de 112 m² en étage élevé avec une vue dégagée sur la baie. Séjour ouvert sur une terrasse de 18 m², cuisine équipée, deux chambres et deux salles d'eau. Résidence neuve avec piscine, salle de sport et gardiennage.",
    transaction: "VENTE", type: "APPARTEMENT", status: "DISPONIBLE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Tanger", district: "Malabata", addressPublic: "Malabata, Tanger", lat: 35.7722, lng: -5.7712, proximity: "Plage de Malabata à 5 min, gare TGV à 10 min.",
    price: 2_450_000, negotiable: true, agencyFeePercent: 2.5, monthlyCharges: 800, livingArea: 112, terraceArea: 18,
    bedrooms: 2, bathrooms: 2, salons: 1, parking: 1, floor: 7, totalFloors: 9, yearBuilt: 2022, furnished: "NON_MEUBLE", condition: "NEUF", orientation: "NORD",
    availability: "IMMEDIATE", goodDeal: true, credit: true,
    details: { kind: "appartement-duplex-penthouse", residenceName: "Résidence Baie Bleue (fictive)", elevator: true, floorPosition: "intermediaire", terrace: true, concierge: true, parkingIncluded: true },
    tags: ["vue-mer", "terrasse", "piscine", "gym", "residence-securisee", "proche-mer", "prix-revise"],
    agent: "karim", owners: [{ owner: 6, role: "PROPRIETAIRE", share: 100, main: true }],
    intermediaries: [{ intermediary: 5, role: "AGENCE_PARTENAIRE", note: "Bien apporté par l'agence partenaire.", commissionRate: 30 }],
    privateAddress: "Résidence fictive, bloc C, appt 72", minimumNetPrice: 2_300_000,
    images: 3, palette: ["#caf0f8", "#48cae4", "#023e8a"], publishedDaysAgo: 25,
  },
  {
    n: 6, title: "Plateau de bureaux à louer, Hay Riad", short: "Plateau de 320 m² aménagé, open space, trois salles de réunion, parking.",
    description: "Dans un immeuble de bureaux récent du quartier d'affaires de Hay Riad, plateau entièrement aménagé : open space de 40 postes, trois salles de réunion, deux bureaux de direction, espace café. Fibre optique, climatisation centralisée, contrôle d'accès et six places de parking.",
    transaction: "LOCATION", type: "BUREAU", subtype: "Plateau aménagé", status: "DISPONIBLE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Rabat", district: "Hay Riad", addressPublic: "Hay Riad, Rabat", lat: 33.9583, lng: -6.8718, proximity: "Accès rocade à 2 min, tramway à 5 min.",
    price: 28_000, securityDeposit: 84_000, monthlyCharges: 3_500, livingArea: 320,
    bathrooms: 3, parking: 6, floor: 3, totalFloors: 6, yearBuilt: 2016, furnished: "SEMI_MEUBLE", condition: "EXCELLENT",
    availability: "SOUS_1_MOIS",
    details: { kind: "commerce-bureau-depot", activityType: "Bureaux", openSpace: true, meetingRooms: 3, loadingDock: false, truckAccess: false, security: "Contrôle d'accès et gardiennage" },
    tags: ["fibre", "climatisation", "videosurveillance", "generateur", "proche-autoroute"],
    agent: "karim", owners: [{ owner: 7, role: "PROPRIETAIRE", share: 100, main: true }],
    privateAddress: "Immeuble fictif B4, 3e étage, Hay Riad",
    images: 3, palette: ["#e9ecef", "#adb5bd", "#343a40"], publishedDaysAgo: 12,
  },
  {
    n: 7, title: "Appartement T3 neuf — Les Terrasses de Founty", short: "T3 de 98 m² avec terrasse, dans une résidence neuve à 300 m de la plage.",
    description: "Lot A-12 du programme Les Terrasses de Founty : T3 de 98 m² avec terrasse de 16 m², séjour orienté sud-ouest, deux chambres, cuisine équipée. Résidence avec piscine, jardin et conciergerie, à 300 m de la plage d'Agadir. Livraison prévue dans un peu plus d'un an.",
    transaction: "PROGRAMME_NEUF", type: "PROGRAMME_NEUF", subtype: "T3", status: "RESERVE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Agadir", district: "Founty", addressPublic: "Founty, Agadir", lat: 30.4017, lng: -9.5866, proximity: "Plage à 300 m, Marina d'Agadir à 5 min.",
    price: 1_650_000, livingArea: 98, terraceArea: 16, bedrooms: 2, bathrooms: 2, salons: 1, parking: 1, floor: 2, totalFloors: 5, yearBuilt: 2027,
    furnished: "NON_MEUBLE", condition: "NEUF", orientation: "SUD_OUEST", availability: "A_LA_LIVRAISON", credit: true, mourabaha: true, featured: true,
    details: { kind: "programme-neuf", developerNameTemp: "Atlas Horizon Immobilier (démo)", programName: "Les Terrasses de Founty", phase: "Tranche 1", deliveryDate: "T4 2027", typology: "T3", lotNumber: "A-12", unitsAvailable: 18 },
    tags: ["nouveau", "piscine", "terrasse", "proche-mer", "residence-securisee", "investissement"],
    agent: "karim", program: { program: 1, lot: "A-12" },
    images: 3, palette: ["#ffe8d6", "#ffb703", "#219ebc"], publishedDaysAgo: 30,
  },
  {
    n: 8, title: "Villa proche golf à Diabat, Essaouira", short: "Villa de quatre chambres avec piscine, à deux pas du golf et de la plage de Diabat.",
    description: "Villa de plain-pied de 260 m² sur une parcelle de 900 m², dans une résidence proche du golf de Mogador. Grand séjour avec cheminée, quatre chambres, piscine et jardin méditerranéen. À 10 minutes de la médina d'Essaouira.",
    transaction: "VENTE", type: "VILLA", status: "DISPONIBLE", publication: "PUBLIE", visibility: "PUBLIC",
    city: "Essaouira", district: "Diabat", addressPublic: "Diabat, Essaouira", lat: 31.4935, lng: -9.7602, proximity: "Golf à 3 min, médina à 10 min.",
    price: 4_900_000, negotiable: true, agencyFeePercent: 2.5, livingArea: 260, builtArea: 280, landArea: 900, terraceArea: 60,
    bedrooms: 4, suites: 1, bathrooms: 3, salons: 1, parking: 2, totalFloors: 1, yearBuilt: 2015, furnished: "MEUBLE", condition: "BON_ETAT", orientation: "SUD",
    availability: "SOUS_3_MOIS", yieldPercent: 5.8,
    details: { kind: "villa-maison-riad", pool: true, garden: true, outbuildings: false, rooftop: false, view: "Golf et dunes", fireplace: true, hammam: false },
    tags: ["piscine", "jardin", "golf", "proche-golf", "proche-mer", "calme", "airbnb-autorise"],
    agent: "salma", owners: [{ owner: 8, role: "PROPRIETAIRE", share: 100, main: true }],
    privateAddress: "Résidence fictive du golf, villa 5, Diabat", minimumNetPrice: 4_500_000,
    images: 3, palette: ["#f1faee", "#a8dadc", "#457b9d"], publishedDaysAgo: 8,
  },

  // --- 2 OFF_MARKET / PUBLIE — discreet: no district, no coordinates, no photos, price on request
  {
    n: 9, title: "Propriété d'exception, Anfa Supérieur", short: "Propriété familiale de plus de 900 m² habitables sur un parc arboré. Présentation sur rendez-vous.",
    description: "Rare sur le marché : propriété familiale sur un parc arboré de plus de 3 000 m², volumes de réception exceptionnels, dépendances pour le personnel, piscine et court de tennis. Dossier communiqué uniquement après qualification.",
    transaction: "VENTE", type: "VILLA", status: "DISPONIBLE", publication: "PUBLIE", visibility: "OFF_MARKET",
    city: "Casablanca", district: null, lat: null, lng: null,
    price: 32_000_000, priceOnRequest: true, livingArea: 920, landArea: 3200, bedrooms: 7, suites: 5, bathrooms: 8, salons: 4, parking: 6,
    yearBuilt: 2005, condition: "EXCELLENT", exclusive: true,
    details: { kind: "villa-maison-riad", pool: true, garden: true, outbuildings: true, rooftop: false, view: "Parc", fireplace: true, hammam: true },
    tags: ["piscine", "tennis", "jardin", "rare", "exclusivite", "gardien"],
    agent: "direction", owners: [{ owner: 4, role: "PROPRIETAIRE", share: 100, main: true }],
    privateAddress: "Propriété fictive, Anfa Supérieur", minimumNetPrice: 29_500_000, internalNotes: "Mandat off-market : aucune photo publique, visites uniquement accompagnées par la direction.",
    publishedDaysAgo: 22,
  },
  {
    n: 10, title: "Terrain front de mer, baie de Taghazout", short: "Terrain titré avec accès direct à la plage, adapté à un projet hôtelier. Prix sur demande.",
    description: "Terrain de 1,2 hectare en front de mer, titré, avec un accès direct à la plage. Zonage touristique permettant un projet hôtelier ou de résidences. Informations détaillées réservées aux investisseurs qualifiés.",
    transaction: "VENTE", type: "TERRAIN", status: "DISPONIBLE", publication: "PUBLIE", visibility: "OFF_MARKET",
    city: "Agadir", district: null, lat: null, lng: null,
    price: 18_000_000, priceOnRequest: true, landArea: 12000,
    details: { kind: "terrain", zoning: "Zone touristique", frontageMeters: 85, buildable: true, titleDeed: "titre-foncier", utilitiesConnected: true, view: "Océan" },
    tags: ["bord-de-mer", "constructible", "titre", "investissement", "rare"],
    agent: "direction", owners: [{ owner: 4, role: "PROPRIETAIRE", share: 100, main: true }],
    privateAddress: "Parcelle fictive TF 00000/DEMO, Taghazout", minimumNetPrice: 16_500_000,
    publishedDaysAgo: 15,
  },

  // --- BROUILLON ------------------------------------------------------------
  {
    n: 11, title: "Terrain à bâtir, route de l'Ourika", short: "Terrain de 5 000 m² avec vue sur l'Atlas, constructible pour une villa.",
    description: "Parcelle plate de 5 000 m² à 15 minutes de Marrakech, eau et électricité en bordure, vue dégagée sur l'Atlas. Idéal projet de villa ou petite maison d'hôtes.",
    transaction: "VENTE", type: "TERRAIN", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Marrakech", district: "Route de l'Ourika", lat: 31.5602, lng: -7.9498,
    price: 2_200_000, negotiable: true, landArea: 5000,
    details: { kind: "terrain", zoning: "Zone villas", frontageMeters: 50, buildable: true, titleDeed: "titre-foncier", utilitiesConnected: true, view: "Atlas" },
    tags: ["vue-montagne", "constructible", "titre", "eau", "electricite"],
    agent: "salma", owners: [{ owner: 3, role: "PROPRIETAIRE", share: 50, main: true }, { owner: 5, role: "INDIVISAIRE", share: 50 }],
    internalNotes: "Photos à faire lors du prochain passage.",
  },
  {
    n: 12, title: "Local commercial angle de rue, Gauthier", short: "Local de 180 m² en angle avec double vitrine, forte visibilité.",
    description: "Local commercial d'angle au rez-de-chaussée d'un immeuble de standing, double vitrine, mezzanine de 40 m², réserve et sanitaires. Fort passage piéton.",
    transaction: "VENTE", type: "COMMERCE", subtype: "Local commercial", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Casablanca", district: "Gauthier", lat: 33.5903, lng: -7.6289,
    price: 5_400_000, livingArea: 180, yearBuilt: 2008, condition: "BON_ETAT",
    details: { kind: "commerce-bureau-depot", activityType: "Commerce de détail", salesAreaSqm: 140, storageAreaSqm: 40, footTraffic: "eleve", openSpace: true, loadingDock: false, truckAccess: false },
    tags: ["centre-ville", "proche-commerces", "investissement"],
    agent: "yassine", owners: [{ owner: 4, role: "PROPRIETAIRE", share: 100, main: true }],
    internalNotes: "Prix à revoir avec la SCI après l'échec du premier acquéreur.",
  },
  {
    n: 13, title: "Bureaux en vente, Agdal", short: "Bureaux de 210 m² cloisonnés, deux parkings, immeuble de standing.",
    description: "Bureaux de 210 m² au 2e étage : accueil, sept bureaux, salle de réunion, archives. Immeuble de standing avec ascenseur et gardiennage, à proximité de la gare Rabat-Agdal.",
    transaction: "VENTE", type: "BUREAU", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Rabat", district: "Agdal", lat: 33.9992, lng: -6.8491,
    price: 4_100_000, livingArea: 210, parking: 2, floor: 2, totalFloors: 5, yearBuilt: 2010, condition: "BON_ETAT",
    details: { kind: "commerce-bureau-depot", activityType: "Bureaux", openSpace: false, meetingRooms: 1, security: "Gardiennage" },
    tags: ["centre-ville", "climatisation", "fibre"],
    agent: "karim", owners: [{ owner: 7, role: "PROPRIETAIRE", share: 100, main: true }],
  },
  {
    n: 14, title: "Appartement T3 neuf — Marina Bay Résidences", short: "T3 de 104 m² au 8e étage, vue détroit, livraison fin 2027.",
    description: "Lot T1-0804 : T3 de 104 m² avec balcon filant vue sur le détroit de Gibraltar, deux chambres, cuisine ouverte. Résidence avec commerces en pied d'immeuble et parking.",
    transaction: "PROGRAMME_NEUF", type: "PROGRAMME_NEUF", subtype: "T3", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Tanger", district: "Tanger Marina", lat: 35.7856, lng: -5.8043,
    price: 1_980_000, livingArea: 104, bedrooms: 2, bathrooms: 2, floor: 8, totalFloors: 14, yearBuilt: 2027, condition: "NEUF", availability: "A_LA_LIVRAISON",
    details: { kind: "programme-neuf", developerNameTemp: "Détroit Développement (démo)", programName: "Marina Bay Résidences", phase: "Tranche 1", deliveryDate: "Fin 2027", typology: "T3", lotNumber: "T1-0804", unitsAvailable: 42 },
    tags: ["nouveau", "vue-mer", "proche-mer"],
    agent: "karim", program: { program: 2, lot: "T1-0804" },
  },
  {
    n: 15, title: "Appartement T3 — Les Jardins d'Anfa", short: "T3 de 118 m² sur jardin, dans un petit collectif haut de gamme.",
    description: "Lot J-101 : T3 de 118 m² au 1er étage, ouvert sur le jardin paysager de la résidence. Prestations haut de gamme, parking en sous-sol, livraison 2028.",
    transaction: "PROGRAMME_NEUF", type: "PROGRAMME_NEUF", subtype: "T3", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Casablanca", district: "Anfa", lat: 33.5864, lng: -7.6393,
    price: 2_750_000, livingArea: 118, bedrooms: 2, bathrooms: 2, floor: 1, totalFloors: 4, yearBuilt: 2028, condition: "NEUF", availability: "A_LA_LIVRAISON",
    details: { kind: "programme-neuf", developerNameTemp: "Anfa Premium Promotion (démo)", programName: "Les Jardins d'Anfa", phase: "Unique", deliveryDate: "2028", typology: "T3", lotNumber: "J-101", unitsAvailable: 12 },
    tags: ["nouveau", "vue-jardin", "residentiel"],
    agent: "yassine", program: { program: 3, lot: "J-101" },
  },
  {
    n: 16, title: "Appartement meublé à louer, Guéliz", short: "Deux chambres meublées, proche de l'avenue Mohammed V.",
    description: "Appartement de 95 m² entièrement meublé et équipé, deux chambres, balcon, climatisation. Proche commerces et restaurants de Guéliz.",
    transaction: "LOCATION", type: "APPARTEMENT", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Marrakech", district: "Guéliz", lat: 31.6361, lng: -8.0102,
    price: 14_000, securityDeposit: 28_000, monthlyCharges: 600, livingArea: 95, bedrooms: 2, bathrooms: 1, salons: 1, floor: 3, totalFloors: 5,
    furnished: "MEUBLE", condition: "BON_ETAT", availability: "IMMEDIATE",
    details: { kind: "appartement-duplex-penthouse", elevator: true, floorPosition: "intermediaire", terrace: false, concierge: false, parkingIncluded: false },
    tags: ["centre-ville", "climatisation", "balcon", "proche-commerces", "wifi"],
    agent: "salma", owners: [{ owner: 5, role: "PROPRIETAIRE", share: 100, main: true }],
  },
  {
    n: 17, title: "Local commercial à louer, boulevard Pasteur", short: "Boutique de 90 m² sur artère commerçante du centre-ville.",
    description: "Boutique de 90 m² avec vitrine sur le boulevard, réserve et point d'eau. Idéal prêt-à-porter ou agence.",
    transaction: "LOCATION", type: "COMMERCE", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Tanger", district: "Centre-ville", lat: 35.7801, lng: -5.8131,
    price: 22_000, securityDeposit: 66_000, livingArea: 90, condition: "A_RAFRAICHIR",
    details: { kind: "commerce-bureau-depot", activityType: "Commerce de détail", salesAreaSqm: 75, storageAreaSqm: 15, footTraffic: "eleve", monthlyLeaseRent: 22000 },
    tags: ["centre-ville", "proche-commerces"],
    agent: "karim", owners: [{ owner: 6, role: "PROPRIETAIRE", share: 100, main: true }],
  },
  {
    n: 18, title: "Riad à rénover, médina d'Essaouira", short: "Riad de cinq chambres à rénover, terrasse vue océan, fort potentiel maison d'hôtes.",
    description: "Riad traditionnel dans la médina classée, cinq chambres, patio, terrasse avec vue sur l'océan. Travaux de rénovation à prévoir, fort potentiel pour une maison d'hôtes.",
    transaction: "VENTE", type: "RIAD", status: "DISPONIBLE", publication: "BROUILLON", visibility: "PUBLIC",
    city: "Essaouira", district: "Médina", lat: 31.5131, lng: -9.7701,
    price: 2_650_000, negotiable: true, livingArea: 240, landArea: 130, terraceArea: 70, bedrooms: 5, bathrooms: 3, totalFloors: 3, yearBuilt: 1900, condition: "A_RENOVER",
    details: { kind: "villa-maison-riad", pool: false, garden: false, outbuildings: false, rooftop: true, view: "Océan", fireplace: false, hammam: false },
    tags: ["medina", "patio", "rooftop", "vue-mer", "maison-hotes-autorisee"],
    agent: "salma", owners: [{ owner: 8, role: "PROPRIETAIRE", share: 100, main: true }],
    internalNotes: "Devis travaux à obtenir avant publication.",
  },

  // --- ARCHIVE (closed deals) ------------------------------------------------
  {
    n: 19, title: "Appartement familial à Souissi", short: "Quatre pièces de 150 m² avec jardin privatif — vendu.",
    description: "Appartement en rez-de-jardin de 150 m² dans une résidence calme de Souissi : trois chambres, grand séjour, jardin privatif de 80 m². Bien vendu par l'agence.",
    transaction: "VENTE", type: "APPARTEMENT", status: "VENDU", publication: "ARCHIVE", visibility: "PUBLIC",
    city: "Rabat", district: "Souissi", lat: 33.9762, lng: -6.8288,
    price: 3_200_000, livingArea: 150, bedrooms: 3, bathrooms: 2, salons: 1, parking: 1, floor: 0, totalFloors: 3, yearBuilt: 2014, condition: "EXCELLENT",
    details: { kind: "appartement-duplex-penthouse", elevator: true, floorPosition: "rdc", terrace: true, concierge: true, parkingIncluded: true },
    tags: ["jardin", "residentiel", "calme", "proche-ecole"],
    agent: "karim", owners: [{ owner: 2, role: "PROPRIETAIRE", share: 100, main: true }],
    intermediaries: [
      { intermediary: 1, role: "APPORTEUR", note: "A apporté l'acquéreur.", commissionRate: 15 },
      { intermediary: 4, role: "NOTAIRE", note: "Acte signé à l'étude." },
    ],
    minimumNetPrice: 3_000_000, archivedDaysAgo: 18, publishedDaysAgo: 120,
  },
  {
    n: 20, title: "Villa avec piscine à louer, Agadir", short: "Villa de trois chambres avec piscine — louée.",
    description: "Villa de 210 m² avec piscine et jardin dans un quartier résidentiel d'Agadir, trois chambres, garage. Bien loué par l'agence.",
    transaction: "LOCATION", type: "VILLA", status: "LOUE", publication: "ARCHIVE", visibility: "PUBLIC",
    city: "Agadir", district: "Cité Dakhla", lat: 30.4098, lng: -9.5702,
    price: 18_000, securityDeposit: 36_000, livingArea: 210, landArea: 500, bedrooms: 3, bathrooms: 2, salons: 1, parking: 2, furnished: "MEUBLE", condition: "BON_ETAT",
    details: { kind: "villa-maison-riad", pool: true, garden: true, outbuildings: false, rooftop: false, fireplace: false, hammam: false },
    tags: ["piscine", "jardin", "residentiel"],
    agent: "salma", owners: [{ owner: 8, role: "PROPRIETAIRE", share: 100, main: true }],
    archivedDaysAgo: 30, publishedDaysAgo: 90,
  },
];

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export type DemoProspect = {
  n: number;
  type: ProspectType;
  kind?: PartyKind;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  language?: ProspectLanguage;
  source: ProspectSource;
  status: ProspectStatus;
  formOrigin?: ProspectFormOrigin;
  cities: string[];
  districts?: string[];
  types: PropertyType[];
  transaction?: PropertyTransaction;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  notes: string;
  agent?: UserKey;
  createdDaysAgo: number;
  interests?: { property: number; level: InterestLevel; note?: string }[];
};

export const demoProspects: DemoProspect[] = [
  { n: 1, type: "ACHETEUR", firstName: "Rachid", lastName: "Benjelloun", email: "rachid.benjelloun@example.test", source: "SITE_WEB", formOrigin: "CONTACT", status: "VISITE_PLANIFIEE", cities: ["Casablanca"], districts: ["Anfa", "Californie"], types: ["VILLA"], transaction: "VENTE", budgetMin: 10_000_000, budgetMax: 16_000_000, timeline: "3 mois", notes: "Cadre dirigeant, famille de quatre enfants. Veut une villa avec piscine près des écoles.", agent: "yassine", createdDaysAgo: 30, interests: [{ property: 1, level: "FAVORI", note: "Coup de cœur à la première visite." }, { property: 9, level: "A_SUIVRE" }] },
  { n: 2, type: "ACHETEUR", firstName: "Claire", lastName: "Dubois", email: "claire.dubois@example.test", language: "FR", source: "RECOMMANDATION", status: "NEGOCIATION", cities: ["Marrakech"], districts: ["Médina"], types: ["RIAD"], transaction: "VENTE", budgetMin: 5_000_000, budgetMax: 6_500_000, timeline: "Avant l'été", notes: "Recommandée par un ancien client. Projet de résidence secondaire avec location ponctuelle.", agent: "salma", createdDaysAgo: 45, interests: [{ property: 3, level: "FAVORI", note: "Offre à 5,8 M MAD envisagée." }, { property: 18, level: "REFUSE", note: "Trop de travaux." }] },
  { n: 3, type: "ACHETEUR", firstName: "Hamza", lastName: "Squalli", email: "hamza.squalli@example.test", source: "WHATSAPP", status: "OFFRE", cities: ["Casablanca"], districts: ["Aïn Diab"], types: ["APPARTEMENT"], transaction: "VENTE", budgetMin: 3_000_000, budgetMax: 4_000_000, timeline: "Immédiat", notes: "Financement bancaire accordé en principe via courtier.", agent: "yassine", createdDaysAgo: 60, interests: [{ property: 2, level: "FAVORI" }] },
  { n: 4, type: "LOCATAIRE", firstName: "Inès", lastName: "Berrechid", email: "ines.berrechid@example.test", source: "SITE_WEB", status: "VISITE_PLANIFIEE", cities: ["Marrakech"], districts: ["Palmeraie", "Guéliz"], types: ["VILLA", "APPARTEMENT"], transaction: "LOCATION", budgetMin: 25_000, budgetMax: 40_000, timeline: "1 mois", notes: "Mutation professionnelle, arrive avec sa famille.", agent: "salma", createdDaysAgo: 14, interests: [{ property: 4, level: "INTERESSE" }, { property: 16, level: "A_SUIVRE" }] },
  { n: 5, type: "INVESTISSEUR", firstName: "James", lastName: "Whitfield", email: "james.whitfield@example.test", language: "EN", source: "TELEPHONE", status: "QUALIFIE", cities: ["Agadir", "Tanger"], types: ["PROGRAMME_NEUF", "APPARTEMENT"], transaction: "PROGRAMME_NEUF", budgetMin: 1_200_000, budgetMax: 2_000_000, timeline: "6 mois", notes: "Investisseur britannique, cherche deux lots en VEFA pour location saisonnière.", agent: "karim", createdDaysAgo: 35, interests: [{ property: 7, level: "FAVORI" }, { property: 14, level: "INTERESSE" }] },
  { n: 6, type: "LOCATAIRE", kind: "SOCIETE", companyName: "Nexa Consulting (démo)", email: "office@nexa-consulting.example.test", source: "TELEPHONE", status: "VISITE_PLANIFIEE", cities: ["Rabat"], districts: ["Hay Riad", "Agdal"], types: ["BUREAU"], transaction: "LOCATION", budgetMin: 20_000, budgetMax: 32_000, timeline: "T1 prochain", notes: "Cabinet de conseil de 35 personnes, bail actuel se termine dans 4 mois.", agent: "karim", createdDaysAgo: 10, interests: [{ property: 6, level: "INTERESSE" }, { property: 13, level: "A_SUIVRE" }] },
  { n: 7, type: "VENDEUR", firstName: "Samira", lastName: "Bouzid", email: "samira.bouzid@example.test", source: "SITE_WEB", formOrigin: "VENDRE", status: "NOUVEAU", cities: ["Tanger"], types: ["APPARTEMENT"], transaction: "VENTE", notes: "Demande d'estimation reçue via le formulaire Vendre : appartement 3 pièces à Tanger.", createdDaysAgo: 1 },
  { n: 8, type: "ACHETEUR", firstName: "Adil", lastName: "Mansouri", email: "adil.mansouri@example.test", source: "SITE_WEB", formOrigin: "OFF_MARKET", status: "A_QUALIFIER", cities: ["Casablanca"], types: ["VILLA"], transaction: "VENTE", budgetMin: 25_000_000, budgetMax: 35_000_000, notes: "Demande d'accès à la sélection off-market.", agent: "direction", createdDaysAgo: 3, interests: [{ property: 9, level: "A_SUIVRE" }] },
  { n: 9, type: "ACHETEUR", firstName: "Laila", lastName: "Chafik", email: "laila.chafik@example.test", source: "WHATSAPP", status: "VISITE_PLANIFIEE", cities: ["Tanger"], districts: ["Malabata"], types: ["APPARTEMENT"], transaction: "VENTE", budgetMin: 2_000_000, budgetMax: 2_600_000, timeline: "3 mois", notes: "Primo-accédante, dossier de crédit en cours.", agent: "karim", createdDaysAgo: 9, interests: [{ property: 5, level: "INTERESSE" }] },
  { n: 10, type: "INVESTISSEUR", firstName: "Thomas", lastName: "Leroy", email: "thomas.leroy@example.test", source: "RECOMMANDATION", status: "QUALIFIE", cities: ["Essaouira", "Marrakech"], types: ["RIAD", "VILLA"], transaction: "VENTE", budgetMin: 2_000_000, budgetMax: 5_000_000, timeline: "12 mois", notes: "Projet de maison d'hôtes, souhaite un bien avec potentiel de rendement.", agent: "salma", createdDaysAgo: 21, interests: [{ property: 18, level: "INTERESSE" }, { property: 8, level: "A_SUIVRE" }] },
  { n: 11, type: "ACHETEUR", firstName: "Nabil", lastName: "Harrak", email: "nabil.harrak@example.test", source: "TELEPHONE", status: "GAGNE", cities: ["Rabat"], districts: ["Souissi"], types: ["APPARTEMENT"], transaction: "VENTE", budgetMin: 2_800_000, budgetMax: 3_300_000, notes: "Acquisition finalisée — acte signé.", agent: "karim", createdDaysAgo: 110, interests: [{ property: 19, level: "FAVORI" }] },
  { n: 12, type: "LOCATAIRE", firstName: "Julia", lastName: "Novak", email: "julia.novak@example.test", language: "EN", source: "WHATSAPP", status: "GAGNE", cities: ["Agadir"], types: ["VILLA"], transaction: "LOCATION", budgetMin: 15_000, budgetMax: 20_000, notes: "Bail signé pour 2 ans.", agent: "salma", createdDaysAgo: 80, interests: [{ property: 20, level: "FAVORI" }] },
  { n: 13, type: "ACHETEUR", firstName: "Othmane", lastName: "Guessous", email: "othmane.guessous@example.test", source: "SITE_WEB", formOrigin: "CONTACT", status: "PERDU", cities: ["Marrakech"], types: ["TERRAIN"], transaction: "VENTE", budgetMin: 1_200_000, budgetMax: 1_600_000, notes: "Budget insuffisant pour le terrain de l'Ourika.", agent: "salma", createdDaysAgo: 65, interests: [{ property: 11, level: "REFUSE", note: "Prix jugé trop élevé." }] },
  { n: 14, type: "INVESTISSEUR", firstName: "Kenza", lastName: "Filali", email: "kenza.filali@example.test", source: "TELEPHONE", status: "PERDU", cities: ["Casablanca"], types: ["COMMERCE"], transaction: "VENTE", budgetMin: 4_000_000, budgetMax: 6_000_000, notes: "Financement refusé par la banque.", agent: "yassine", createdDaysAgo: 75, interests: [{ property: 12, level: "REFUSE" }] },
  { n: 15, type: "INVESTISSEUR", kind: "SOCIETE", companyName: "Groupe Sahel Invest (démo)", email: "projets@sahel-invest.example.test", source: "RECOMMANDATION", status: "QUALIFIE", cities: ["Agadir"], types: ["TERRAIN", "HOTEL"], transaction: "VENTE", budgetMin: 15_000_000, budgetMax: 20_000_000, timeline: "2027", notes: "Groupe hôtelier, cherche du foncier en front de mer.", agent: "direction", createdDaysAgo: 28, interests: [{ property: 10, level: "INTERESSE", note: "Étude de faisabilité en cours." }] },
  { n: 16, type: "VENDEUR", firstName: "Meryem", lastName: "Tahiri", email: "meryem.tahiri@example.test", source: "TELEPHONE", status: "QUALIFIE", cities: ["Casablanca"], districts: ["Maârif"], types: ["APPARTEMENT"], transaction: "VENTE", notes: "Souhaite vendre un appartement familial au Maârif, estimation à planifier.", agent: "yassine", createdDaysAgo: 6 },
  { n: 17, type: "VENDEUR", firstName: "Driss", lastName: "Ait Lahcen", email: "driss.aitlahcen@example.test", language: "AR", source: "RECOMMANDATION", status: "A_QUALIFIER", cities: ["Essaouira"], types: ["RIAD"], transaction: "VENTE", notes: "Propriétaire d'un riad dans la médina, envisage de le confier en mandat.", agent: "salma", createdDaysAgo: 4 },
  { n: 18, type: "LOCATAIRE", firstName: "Sara", lastName: "Lamrani", email: "sara.lamrani@example.test", source: "SITE_WEB", formOrigin: "CONTACT", status: "NOUVEAU", cities: ["Marrakech"], districts: ["Guéliz"], types: ["APPARTEMENT"], transaction: "LOCATION", budgetMin: 12_000, budgetMax: 15_000, notes: "Demande reçue via le formulaire de contact.", createdDaysAgo: 0, interests: [{ property: 16, level: "A_SUIVRE" }] },
];

// ---------------------------------------------------------------------------
// Opportunities (10: 6 open, 2 won, 2 lost)
// ---------------------------------------------------------------------------

export type DemoOpportunity = {
  n: number;
  prospect: number;
  property?: number;
  transaction: PropertyTransaction;
  title: string;
  stage: OpportunityStage;
  estimatedAmount?: number;
  finalAmount?: number;
  closeInDays?: number;
  closedDaysAgo?: number;
  lossReason?: OpportunityLossReason;
  lossNote?: string;
  note?: string;
  agent: UserKey;
  createdDaysAgo: number;
  lastActivityDaysAgo: number;
};

export const demoOpportunities: DemoOpportunity[] = [
  { n: 1, prospect: 8, transaction: "VENTE", title: "Recherche villa off-market Casablanca", stage: "NOUVELLE", estimatedAmount: 30_000_000, closeInDays: 120, agent: "direction", createdDaysAgo: 3, lastActivityDaysAgo: 1 },
  { n: 2, prospect: 1, property: 1, transaction: "VENTE", title: "Villa Anfa — famille Benjelloun", stage: "VISITE", estimatedAmount: 14_500_000, closeInDays: 60, agent: "yassine", createdDaysAgo: 28, lastActivityDaysAgo: 9, note: "Contre-visite prévue avec l'architecte de l'acquéreur." },
  { n: 3, prospect: 4, property: 4, transaction: "LOCATION", title: "Location villa Palmeraie", stage: "OFFRE", estimatedAmount: 36_000, closeInDays: 5, agent: "salma", createdDaysAgo: 12, lastActivityDaysAgo: 2, note: "Offre à 36 000 MAD/mois pour un bail de 2 ans." },
  { n: 4, prospect: 2, property: 3, transaction: "VENTE", title: "Riad Mouassine — C. Dubois", stage: "NEGOCIATION", estimatedAmount: 5_900_000, closeInDays: 20, agent: "salma", createdDaysAgo: 40, lastActivityDaysAgo: 3 },
  { n: 5, prospect: 5, property: 7, transaction: "PROGRAMME_NEUF", title: "Lot A-12 Terrasses de Founty", stage: "RESERVATION", estimatedAmount: 1_650_000, closeInDays: 30, agent: "karim", createdDaysAgo: 30, lastActivityDaysAgo: 4 },
  { n: 6, prospect: 3, property: 2, transaction: "VENTE", title: "Appartement Aïn Diab — H. Squalli", stage: "COMPROMIS", estimatedAmount: 3_750_000, closeInDays: 25, agent: "yassine", createdDaysAgo: 55, lastActivityDaysAgo: 5 },
  { n: 7, prospect: 11, property: 19, transaction: "VENTE", title: "Appartement Souissi — N. Harrak", stage: "GAGNEE", estimatedAmount: 3_200_000, finalAmount: 3_100_000, closedDaysAgo: 20, agent: "karim", createdDaysAgo: 105, lastActivityDaysAgo: 20 },
  { n: 8, prospect: 12, property: 20, transaction: "LOCATION", title: "Location villa Agadir — J. Novak", stage: "GAGNEE", estimatedAmount: 18_000, finalAmount: 18_000, closedDaysAgo: 32, agent: "salma", createdDaysAgo: 75, lastActivityDaysAgo: 32 },
  { n: 9, prospect: 13, property: 11, transaction: "VENTE", title: "Terrain Ourika — O. Guessous", stage: "PERDUE", estimatedAmount: 2_200_000, closedDaysAgo: 35, lossReason: "PRIX", lossNote: "L'acquéreur plafonnait à 1,6 M MAD, le propriétaire refuse de descendre sous 2 M MAD.", agent: "salma", createdDaysAgo: 60, lastActivityDaysAgo: 35 },
  { n: 10, prospect: 14, property: 12, transaction: "VENTE", title: "Local Gauthier — K. Filali", stage: "PERDUE", estimatedAmount: 5_400_000, closedDaysAgo: 25, lossReason: "FINANCEMENT", lossNote: "Prêt professionnel refusé, l'investisseuse suspend son projet.", agent: "yassine", createdDaysAgo: 70, lastActivityDaysAgo: 25 },
];

// ---------------------------------------------------------------------------
// Visits (16) — days relative to today; hour in local time
// ---------------------------------------------------------------------------

export type DemoVisit = {
  n: number;
  prospect: number;
  property: number;
  opportunity?: number;
  day: number;
  hour: number;
  status: VisitStatus;
  type: VisitType;
  participants?: number;
  preNote?: string;
  feedback?: string;
  internalNote?: string;
  postInterest?: PostVisitInterest;
  followUpInDays?: number;
  agent: UserKey;
};

export const demoVisits: DemoVisit[] = [
  { n: 1, prospect: 1, property: 1, opportunity: 2, day: -12, hour: 10, status: "REALISEE", type: "PREMIERE_VISITE", participants: 2, feedback: "Très séduits par les volumes et le jardin.", postInterest: "FORT", agent: "yassine" },
  { n: 2, prospect: 1, property: 1, opportunity: 2, day: 2, hour: 15, status: "CONFIRMEE", type: "REVISITE", participants: 3, preNote: "Contre-visite avec l'architecte de l'acquéreur.", agent: "yassine" },
  { n: 3, prospect: 2, property: 3, opportunity: 4, day: -25, hour: 11, status: "REALISEE", type: "PREMIERE_VISITE", participants: 1, feedback: "Adore le patio et le rooftop.", postInterest: "FORT", agent: "salma" },
  { n: 4, prospect: 2, property: 3, opportunity: 4, day: -10, hour: 16, status: "REALISEE", type: "REVISITE", participants: 2, feedback: "Souhaite faire une offre sous réserve du diagnostic toiture.", postInterest: "OFFRE_ENVISAGEE", agent: "salma" },
  { n: 5, prospect: 3, property: 2, opportunity: 6, day: -30, hour: 18, status: "REALISEE", type: "PREMIERE_VISITE", participants: 2, feedback: "Vue mer décisive.", postInterest: "FORT", agent: "yassine" },
  { n: 6, prospect: 4, property: 4, opportunity: 3, day: -6, hour: 10, status: "REALISEE", type: "PREMIERE_VISITE", participants: 4, feedback: "Villa idéale, trouve le loyer un peu élevé.", postInterest: "MOYEN", followUpInDays: 0, agent: "salma" },
  { n: 7, prospect: 4, property: 16, day: -3, hour: 14, status: "ANNULEE", type: "PREMIERE_VISITE", internalNote: "Annulée par la prospecte : a priorisé la villa de la Palmeraie.", agent: "salma" },
  { n: 8, prospect: 6, property: 6, day: 0, hour: 17, status: "PLANIFIEE", type: "PREMIERE_VISITE", participants: 2, preNote: "Visite avec le DG et la responsable RH.", agent: "karim" },
  { n: 9, prospect: 6, property: 13, day: 3, hour: 11, status: "PLANIFIEE", type: "PREMIERE_VISITE", participants: 2, agent: "karim" },
  { n: 10, prospect: 9, property: 5, day: 1, hour: 11, status: "CONFIRMEE", type: "PREMIERE_VISITE", participants: 1, preNote: "Confirmée par WhatsApp.", agent: "karim" },
  { n: 11, prospect: 5, property: 7, opportunity: 5, day: -15, hour: 12, status: "REALISEE", type: "PREMIERE_VISITE", participants: 1, feedback: "Visite du showroom et du chantier, réservation du lot A-12.", postInterest: "FORT", agent: "karim" },
  { n: 12, prospect: 11, property: 19, opportunity: 7, day: -50, hour: 10, status: "REALISEE", type: "PREMIERE_VISITE", participants: 2, feedback: "Offre au prix après négociation.", postInterest: "OFFRE_ENVISAGEE", agent: "karim" },
  { n: 13, prospect: 12, property: 20, opportunity: 8, day: -45, hour: 17, status: "REALISEE", type: "PREMIERE_VISITE", participants: 1, feedback: "Accepte le bail de 2 ans.", postInterest: "FORT", agent: "salma" },
  { n: 14, prospect: 13, property: 11, opportunity: 9, day: -40, hour: 9, status: "REALISEE", type: "PREMIERE_VISITE", participants: 1, feedback: "Terrain intéressant mais au-dessus du budget.", postInterest: "FAIBLE", agent: "salma" },
  { n: 15, prospect: 10, property: 18, day: 6, hour: 10, status: "PLANIFIEE", type: "PREMIERE_VISITE", participants: 2, preNote: "Venir avec un artisan pour chiffrer les travaux.", agent: "salma" },
  { n: 16, prospect: 14, property: 12, opportunity: 10, day: -28, hour: 15, status: "ANNULEE", type: "REVISITE", internalNote: "Annulée : dossier de financement refusé.", agent: "yassine" },
];

// ---------------------------------------------------------------------------
// Activities (20) — today (3), overdue (3), upcoming (4), done (10)
// ---------------------------------------------------------------------------

export type DemoActivity = {
  n: number;
  prospect: number;
  property?: number;
  visit?: number;
  opportunity?: number;
  type: ActivityType;
  title: string;
  content?: string;
  dueDay?: number;
  dueHour?: number;
  status: ActivityStatus;
  doneDay?: number;
  agent: UserKey;
};

export const demoActivities: DemoActivity[] = [
  { n: 1, prospect: 1, property: 1, visit: 1, opportunity: 2, type: "APPEL", title: "Débrief visite villa Anfa", content: "Très bon ressenti, souhaite une contre-visite.", status: "TERMINEE", doneDay: -12, agent: "yassine" },
  { n: 2, prospect: 1, property: 1, opportunity: 2, type: "RELANCE", title: "Relancer pour la contre-visite avec l'architecte", dueDay: 0, dueHour: 11, status: "A_FAIRE", agent: "yassine" },
  { n: 3, prospect: 2, property: 3, opportunity: 4, type: "WHATSAPP", title: "Envoi des plans et du diagnostic du riad", status: "TERMINEE", doneDay: -9, agent: "salma" },
  { n: 4, prospect: 2, property: 3, opportunity: 4, type: "TACHE", title: "Préparer la contre-proposition du vendeur", content: "Le vendeur accepterait 5,95 M MAD.", dueDay: -2, dueHour: 10, status: "A_FAIRE", agent: "salma" },
  { n: 5, prospect: 3, property: 2, opportunity: 6, type: "NOTE", title: "Pièces du compromis reçues", content: "CIN, attestation de financement et RIB reçus.", status: "TERMINEE", doneDay: -5, agent: "yassine" },
  { n: 6, prospect: 3, property: 2, opportunity: 6, type: "TACHE", title: "Coordonner la signature du compromis avec le notaire", dueDay: 3, dueHour: 15, status: "A_FAIRE", agent: "yassine" },
  { n: 7, prospect: 4, property: 4, opportunity: 3, type: "RELANCE", title: "Retour propriétaire sur l'offre locative", dueDay: 0, dueHour: 15, status: "A_FAIRE", agent: "salma" },
  { n: 8, prospect: 5, property: 7, opportunity: 5, type: "EMAIL", title: "Envoi de la grille de prix des Terrasses de Founty", status: "TERMINEE", doneDay: -14, agent: "karim" },
  { n: 9, prospect: 5, property: 7, opportunity: 5, type: "RELANCE", title: "Suivi du dossier bancaire de réservation", dueDay: 5, dueHour: 10, status: "A_FAIRE", agent: "karim" },
  { n: 10, prospect: 6, property: 6, type: "APPEL", title: "Qualification du besoin en bureaux", content: "35 postes, 3 salles de réunion, parking indispensable.", status: "TERMINEE", doneDay: -4, agent: "karim" },
  { n: 11, prospect: 7, type: "APPEL", title: "Rappeler pour planifier l'estimation", dueDay: -1, dueHour: 16, status: "A_FAIRE", agent: "karim" },
  { n: 12, prospect: 8, property: 9, opportunity: 1, type: "RELANCE", title: "Qualifier le budget et le calendrier off-market", dueDay: 0, dueHour: 12, status: "A_FAIRE", agent: "direction" },
  { n: 13, prospect: 9, property: 5, visit: 10, type: "WHATSAPP", title: "Confirmation de la visite à Malabata", status: "TERMINEE", doneDay: -2, agent: "karim" },
  { n: 14, prospect: 10, type: "NOTE", title: "Projet maison d'hôtes", content: "Vise 5 à 6 chambres, rendement cible 8 %.", status: "TERMINEE", doneDay: -7, agent: "salma" },
  { n: 15, prospect: 10, property: 18, type: "RELANCE", title: "Envoyer le dossier du riad d'Essaouira", dueDay: -4, dueHour: 9, status: "A_FAIRE", agent: "salma" },
  { n: 16, prospect: 11, property: 19, opportunity: 7, type: "NOTE", title: "Acte de vente signé", status: "TERMINEE", doneDay: -20, agent: "karim" },
  { n: 17, prospect: 12, property: 20, opportunity: 8, type: "TACHE", title: "État des lieux d'entrée", status: "TERMINEE", doneDay: -33, agent: "salma" },
  { n: 18, prospect: 13, property: 11, opportunity: 9, type: "APPEL", title: "Retour négatif : prix trop élevé", status: "TERMINEE", doneDay: -35, agent: "salma" },
  { n: 19, prospect: 16, type: "RELANCE", title: "Proposer un rendez-vous d'estimation", dueDay: 2, dueHour: 10, status: "A_FAIRE", agent: "yassine" },
  { n: 20, prospect: 17, type: "WHATSAPP", title: "Demander des photos du riad", dueDay: 1, dueHour: 11, status: "A_FAIRE", agent: "salma" },
];

// ---------------------------------------------------------------------------
// Notifications for demo users only
// ---------------------------------------------------------------------------

export type DemoNotification = {
  n: number;
  user: UserKey;
  type: NotificationType;
  title: string;
  /** `{ref}` is replaced by the linked entity's reference. */
  message: string;
  prospect?: number;
  visit?: number;
  activity?: number;
  opportunity?: number;
  read?: boolean;
  hoursAgo: number;
};

export const demoNotifications: DemoNotification[] = [
  { n: 1, user: "direction", type: "NOUVELLE_DEMANDE", title: "Nouvelle demande", message: "Nouvelle demande reçue depuis le site — {ref}.", prospect: 7, hoursAgo: 20 },
  { n: 2, user: "direction", type: "NOUVELLE_DEMANDE", title: "Nouvelle demande", message: "Nouvelle demande reçue depuis le site — {ref}.", prospect: 8, hoursAgo: 70, read: true },
  { n: 3, user: "direction", type: "NOUVELLE_DEMANDE", title: "Nouvelle demande", message: "Nouvelle demande reçue depuis le site — {ref}.", prospect: 18, hoursAgo: 2 },
  { n: 4, user: "yassine", type: "RELANCE_AUJOURD_HUI", title: "Relance aujourd'hui", message: "Relance à faire aujourd'hui — {ref}.", activity: 2, hoursAgo: 1 },
  { n: 5, user: "salma", type: "RELANCE_AUJOURD_HUI", title: "Relance aujourd'hui", message: "Relance à faire aujourd'hui — {ref}.", activity: 7, hoursAgo: 1 },
  { n: 6, user: "direction", type: "RELANCE_AUJOURD_HUI", title: "Relance aujourd'hui", message: "Relance à faire aujourd'hui — {ref}.", activity: 12, hoursAgo: 1 },
  { n: 7, user: "salma", type: "RELANCE_EN_RETARD", title: "Relance en retard", message: "Relance en retard — {ref}.", activity: 4, hoursAgo: 5 },
  { n: 8, user: "karim", type: "RELANCE_EN_RETARD", title: "Relance en retard", message: "Relance en retard — {ref}.", activity: 11, hoursAgo: 5 },
  { n: 9, user: "salma", type: "RELANCE_EN_RETARD", title: "Relance en retard", message: "Relance en retard — {ref}.", activity: 15, hoursAgo: 30, read: true },
  { n: 10, user: "karim", type: "VISITE_A_VENIR", title: "Visite à venir", message: "Visite {ref} à venir — demain.", visit: 10, hoursAgo: 3 },
  { n: 11, user: "salma", type: "VISITE_ANNULEE", title: "Visite annulée", message: "Visite {ref} annulée.", visit: 7, hoursAgo: 72, read: true },
  { n: 12, user: "karim", type: "PROSPECT_ASSIGNE", title: "Prospect assigné", message: "Le prospect {ref} vous a été assigné.", prospect: 6, hoursAgo: 240, read: true },
  { n: 13, user: "salma", type: "PROSPECT_ASSIGNE", title: "Prospect assigné", message: "Le prospect {ref} vous a été assigné.", prospect: 17, hoursAgo: 96 },
  { n: 14, user: "yassine", type: "OPPORTUNITE_STADE", title: "Changement de stade", message: "Opportunité {ref} passée au stade « Compromis ».", opportunity: 6, hoursAgo: 120, read: true },
  { n: 15, user: "salma", type: "OPPORTUNITE_CLOTURE_PROCHE", title: "Clôture proche", message: "Opportunité {ref} : clôture prévue dans moins de 7 jours.", opportunity: 3, hoursAgo: 6 },
  { n: 16, user: "yassine", type: "OPPORTUNITE_SANS_ACTIVITE", title: "Opportunité sans activité", message: "Opportunité {ref} sans activité depuis plus de 7 jours.", opportunity: 2, hoursAgo: 8 },
];

// ---------------------------------------------------------------------------
// Mandates (4 active + 2 finalised) and commission cases (4)
// ---------------------------------------------------------------------------

export type DemoMandate = {
  n: number;
  property: number;
  owner: number;
  type: MandateType;
  status: MandateStatus;
  exclusive: boolean;
  startDay: number;
  endDay: number;
  displayedPrice: number;
  netSellerPrice?: number;
  conditions: string;
};

export const demoMandates: DemoMandate[] = [
  { n: 1, property: 1, owner: 1, type: "EXCLUSIF", status: "ACTIF", exclusive: true, startDay: -45, endDay: 135, displayedPrice: 14_500_000, netSellerPrice: 13_600_000, conditions: "Exclusivité 6 mois, honoraires 2,5 % à la charge du vendeur, reconduction tacite de 3 mois." },
  { n: 2, property: 3, owner: 3, type: "VENTE", status: "ACTIF", exclusive: false, startDay: -170, endDay: 12, displayedPrice: 6_200_000, netSellerPrice: 5_700_000, conditions: "Mandat simple, co-mandat avec Palmeraie Conseil. Arrive à échéance : renouvellement à faire signer." },
  { n: 3, property: 9, owner: 4, type: "OFF_MARKET", status: "ACTIF", exclusive: true, startDay: -25, endDay: 155, displayedPrice: 32_000_000, netSellerPrice: 29_500_000, conditions: "Diffusion confidentielle, visites accompagnées par la direction uniquement." },
  { n: 4, property: 2, owner: 2, type: "VENTE", status: "ACTIF", exclusive: false, startDay: -60, endDay: 60, displayedPrice: 3_850_000, netSellerPrice: 3_650_000, conditions: "Mandat simple, honoraires 2,5 % à la charge de l'acquéreur." },
  { n: 5, property: 19, owner: 2, type: "VENTE", status: "FINALISE", exclusive: false, startDay: -125, endDay: 55, displayedPrice: 3_200_000, netSellerPrice: 3_000_000, conditions: "Mandat finalisé par la vente." },
  { n: 6, property: 20, owner: 8, type: "LOCATION", status: "FINALISE", exclusive: false, startDay: -95, endDay: 85, displayedPrice: 18_000, conditions: "Mandat de location finalisé, honoraires d'un mois de loyer à la charge du locataire." },
];

export type DemoShare = {
  n: number;
  beneficiary: CommissionBeneficiaryType;
  intermediary?: number;
  agent?: UserKey;
  mode: CommissionShareMode;
  value: number;
  status: CommissionShareStatus;
  notes?: string;
};
export type DemoPayment = { n: number; share?: number; amount: number; status: CommissionPaymentStatus; expectedDay?: number; paidDay?: number; method?: string; note?: string };

export type DemoCommission = {
  n: number;
  property: number;
  mandate?: number;
  opportunity?: number;
  transaction: "VENTE" | "LOCATION";
  status: CommissionCaseStatus;
  basis: CommissionBasis;
  baseAmount: number;
  rate?: number;
  amount: number;
  billedTo: CommissionBilledTo;
  finalAmount?: number;
  expectedDay?: number;
  notes: string;
  shares: DemoShare[];
  payments: DemoPayment[];
};

export const demoCommissions: DemoCommission[] = [
  {
    n: 1, property: 19, mandate: 5, opportunity: 7, transaction: "VENTE", status: "PAYEE", basis: "PRIX_FINAL", baseAmount: 3_100_000, rate: 2.5, amount: 77_500,
    billedTo: "VENDEUR", finalAmount: 3_100_000, expectedDay: -15, notes: "Honoraires encaissés en totalité après l'acte.",
    shares: [
      { n: 1, beneficiary: "AGENCE", mode: "POURCENTAGE", value: 60, status: "PAYE" },
      { n: 2, beneficiary: "AGENT_INTERNE", agent: "karim", mode: "POURCENTAGE", value: 25, status: "PAYE" },
      { n: 3, beneficiary: "INTERMEDIAIRE", intermediary: 1, mode: "POURCENTAGE", value: 15, status: "PAYE", notes: "Apporteur de l'acquéreur." },
    ],
    payments: [{ n: 1, amount: 77_500, status: "RECU", expectedDay: -15, paidDay: -14, method: "Virement", note: "Règlement vendeur à l'acte." }],
  },
  {
    n: 2, property: 20, mandate: 6, opportunity: 8, transaction: "LOCATION", status: "PARTIELLEMENT_PAYEE", basis: "MONTANT_FIXE", baseAmount: 18_000, amount: 18_000,
    billedTo: "LOCATAIRE", finalAmount: 18_000, expectedDay: 10, notes: "Un mois de loyer, réglé en deux fois par la locataire.",
    shares: [
      { n: 1, beneficiary: "AGENCE", mode: "POURCENTAGE", value: 70, status: "VALIDE" },
      { n: 2, beneficiary: "AGENT_INTERNE", agent: "salma", mode: "POURCENTAGE", value: 30, status: "VALIDE" },
    ],
    payments: [
      { n: 1, amount: 9_000, status: "RECU", expectedDay: -30, paidDay: -30, method: "Chèque" },
      { n: 2, amount: 9_000, status: "PREVU", expectedDay: 10, method: "Virement" },
    ],
  },
  {
    n: 3, property: 2, mandate: 4, opportunity: 6, transaction: "VENTE", status: "PREVISION", basis: "PRIX_FINAL", baseAmount: 3_750_000, rate: 2.5, amount: 93_750,
    billedTo: "ACQUEREUR", expectedDay: 45, notes: "Prévisionnel sur le prix du compromis, à confirmer à l'acte.",
    shares: [
      { n: 1, beneficiary: "AGENCE", mode: "POURCENTAGE", value: 75, status: "PREVU" },
      { n: 2, beneficiary: "AGENT_INTERNE", agent: "yassine", mode: "POURCENTAGE", value: 20, status: "PREVU" },
      { n: 3, beneficiary: "INTERMEDIAIRE", intermediary: 3, mode: "MONTANT_FIXE", value: 4_687.5, status: "PREVU", notes: "Rétrocession courtier." },
    ],
    payments: [{ n: 1, amount: 93_750, status: "PREVU", expectedDay: 45 }],
  },
  {
    n: 4, property: 3, mandate: 2, opportunity: 4, transaction: "VENTE", status: "A_CONFIRMER", basis: "PRIX_FINAL", baseAmount: 5_900_000, rate: 3, amount: 177_000,
    billedTo: "VENDEUR", expectedDay: 60, notes: "Montant à confirmer selon le prix final négocié.",
    shares: [
      { n: 1, beneficiary: "AGENCE", mode: "POURCENTAGE", value: 60, status: "PREVU" },
      { n: 2, beneficiary: "INTERMEDIAIRE", intermediary: 2, mode: "POURCENTAGE", value: 40, status: "PREVU", notes: "Partage co-mandat 40/60." },
    ],
    payments: [],
  },
];
