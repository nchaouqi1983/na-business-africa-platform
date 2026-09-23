import { IMPORT_CSV_COLUMNS } from "@/lib/admin/import-row-schema";

type TemplateRow = Record<(typeof IMPORT_CSV_COLUMNS)[number], string>;

function emptyRow(): TemplateRow {
  const row = {} as TemplateRow;
  for (const column of IMPORT_CSV_COLUMNS) row[column] = "";
  return row;
}

function row(overrides: Partial<TemplateRow>): TemplateRow {
  return { ...emptyRow(), ...overrides } as TemplateRow;
}

/**
 * Five example rows, one per major type group, so every documented CSV
 * column (including the per-type `d_*` detail columns) appears filled in at
 * least once somewhere in the template.
 */
const EXAMPLE_ROWS: TemplateRow[] = [
  row({
    source_external_id: "CP-00123",
    titre: "Villa avec piscine à Marrakech",
    transaction: "vente",
    type_bien: "villa",
    sous_type: "villa-piscine",
    ville: "Marrakech",
    quartier: "Palmeraie",
    adresse_publique: "Route de la Palmeraie",
    latitude: "31.669",
    longitude: "-7.949",
    rayon_proximite: "5",
    prix_mad: "4500000",
    devise: "MAD",
    prix_sur_demande: "non",
    prix_m2: "14062",
    negociable: "oui",
    frais_agence: "3",
    rendement_estime: "",
    surface_habitable: "320",
    surface_terrain: "1200",
    surface_construite: "280",
    terrasse: "40",
    balcon: "",
    sous_sol: "60",
    chambres: "5",
    suites: "2",
    salles_de_bain: "4",
    salons: "2",
    cuisines: "1",
    parking: "3",
    etages: "2",
    annee_construction: "2018",
    etat: "excellent",
    meuble: "non-meuble",
    orientation: "sud",
    disponibilite: "immediate",
    a_la_une: "oui",
    bonne_affaire: "non",
    coup_de_coeur: "oui",
    exclusif: "oui",
    description_courte: "Villa contemporaine avec piscine et jardin arboré.",
    description_complete: "Magnifique villa de 320 m² habitables, piscine chauffée, jardin paysager de 1200 m².",
    statut: "disponible",
    visibilite: "PUBLIC",
    tags: "piscine|jardin|vue-jardin",
    image_urls: "https://www.capitalparc.ma/photos/villa-palmeraie-1.jpg|https://www.capitalparc.ma/photos/villa-palmeraie-2.jpg",
    d_piscine: "oui",
    d_jardin: "oui",
    d_dependances: "non",
    d_rooftop: "non",
    d_vue: "Jardin et piscine",
    d_cheminee: "oui",
    d_hammam: "non",
  }),
  row({
    source_external_id: "CP-00124",
    titre: "Appartement vue mer à Tanger",
    transaction: "location",
    type_bien: "appartement",
    sous_type: "appartement-vue-mer",
    ville: "Tanger",
    quartier: "Malabata",
    prix_sur_demande: "oui",
    surface_habitable: "95",
    chambres: "2",
    salles_de_bain: "1",
    statut: "disponible",
    visibilite: "OFF_MARKET",
    tags: "vue-mer",
    d_nom_residence: "Résidence Malabata Bay",
    d_ascenseur: "oui",
    d_position_etage: "intermediaire",
    d_terrasse_appt: "oui",
    d_concierge: "oui",
    d_parking_inclus: "non",
  }),
  row({
    source_external_id: "CP-00125",
    titre: "Terrain constructible à Amelkis",
    transaction: "vente",
    type_bien: "terrain",
    sous_type: "terrain-constructible",
    ville: "Marrakech",
    quartier: "Amelkis",
    prix_mad: "1800000",
    surface_terrain: "650",
    statut: "disponible",
    visibilite: "PUBLIC",
    d_zonage: "Résidentiel villas",
    d_facade_metres: "22",
    d_constructible: "oui",
    d_type_titre: "titre-foncier",
    d_viabilise: "oui",
    d_pente_pourcent: "2",
    d_vue: "Golf",
  }),
  row({
    source_external_id: "CP-00126",
    titre: "Hôtel boutique à Essaouira",
    transaction: "vente",
    type_bien: "hotel",
    sous_type: "hotel-boutique",
    ville: "Essaouira",
    quartier: "Médina",
    prix_mad: "12000000",
    surface_habitable: "600",
    statut: "disponible",
    visibilite: "PUBLIC",
    d_nombre_chambres_hotel: "14",
    d_capacite_personnes: "28",
    d_type_licence: "Hébergement touristique",
    d_restaurant_sur_place: "oui",
    d_spa: "non",
    d_piscine: "oui",
    d_taux_occupation_pourcent: "62",
    d_revenu_indicatif: "1800000",
  }),
  row({
    source_external_id: "CP-00127",
    titre: "Bureau open space à Casablanca",
    transaction: "location",
    type_bien: "bureau",
    sous_type: "bureau-openspace",
    ville: "Casablanca",
    quartier: "CIL",
    prix_mad: "18000",
    surface_habitable: "120",
    statut: "disponible",
    visibilite: "PUBLIC",
    tags: "fibre|wifi",
    d_type_activite: "Bureaux",
    d_surface_vente: "",
    d_surface_stockage: "10",
    d_type_bail: "3/6/9",
    d_loyer_mensuel: "18000",
    d_frequentation: "moyen",
    d_licence: "",
    d_openspace: "oui",
    d_salles_reunion: "2",
    d_quai_chargement: "non",
    d_hauteur_plafond: "2.7",
    d_securite: "Gardiennage 24/24",
    d_acces_camion: "non",
  }),
];

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildImportCsvTemplate(): string {
  const lines = [
    IMPORT_CSV_COLUMNS.join(","),
    ...EXAMPLE_ROWS.map((row) => IMPORT_CSV_COLUMNS.map((column) => escapeCsvField(row[column])).join(",")),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}
