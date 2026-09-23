import {
  CORE_COLUMNS,
  LOCATION_COLUMNS,
  COMMERCIAL_COLUMNS,
  SURFACE_COLUMNS,
  ROOM_COLUMNS,
  CONDITION_COLUMNS,
  MARKETING_COLUMNS,
  CONTENT_COLUMNS,
  STATUS_COLUMNS,
  IMAGE_COLUMNS,
  DETAILS_COLUMNS_BY_GROUP,
  REQUIRED_IMPORT_COLUMNS,
  MAX_IMPORT_ROWS,
  MAX_IMAGE_URLS_PER_ROW,
} from "@/lib/admin/import-row-schema";
import { MAX_PHOTOS_PER_PROPERTY } from "@/lib/media/constants";

const columnDescriptions: Record<string, string> = {
  source_external_id: "Identifiant unique côté source (ex. référence Capital Parc). Sert à détecter les doublons entre deux imports.",
  titre: "Titre du bien (200 caractères max).",
  transaction: "Slug ou libellé français : vente, location, location saisonnière, programme neuf.",
  type_bien: "Slug ou libellé français (villa, appartement, riad, terrain, commerce…).",
  sous_type: "Doit correspondre à un sous-type existant pour le type_bien indiqué.",

  ville: "Ville (texte libre).",
  quartier: "Quartier (texte libre).",
  adresse_publique: "Adresse publique affichée sur le site.",
  latitude: "Décimal, entre -90 et 90. Alimente directement la carte du dossier bien.",
  longitude: "Décimal, entre -180 et 180. Alimente directement la carte du dossier bien.",
  rayon_proximite: "Rayon en km — stocké tel quel dans les notes de proximité du bien.",

  prix_mad: "Prix en MAD. Requis sauf si prix_sur_demande = oui.",
  devise: "Code devise (3-8 caractères). Par défaut : MAD.",
  prix_sur_demande: "oui/non (ou vrai/faux, 1/0). Par défaut : non.",
  prix_m2: "Prix au m², décimal positif.",
  negociable: "oui/non — prix négociable.",
  frais_agence: "Pourcentage (0 à 100).",
  rendement_estime: "Pourcentage de rendement locatif estimé (0 à 100).",

  surface_habitable: "En m², décimal.",
  surface_terrain: "En m², décimal.",
  surface_construite: "En m², décimal.",
  terrasse: "Surface de terrasse en m².",
  balcon: "Surface de balcon en m².",
  sous_sol: "Surface de sous-sol en m².",

  chambres: "Nombre entier.",
  suites: "Nombre entier.",
  salles_de_bain: "Nombre entier.",
  salons: "Nombre entier.",
  cuisines: "Nombre entier.",
  parking: "Nombre de places de parking.",
  etages: "Nombre total d'étages de l'immeuble.",
  annee_construction: "Année (1900 à aujourd'hui + 3).",

  etat: "Slug ou libellé français : neuf, excellent, bon état, à rafraîchir, à rénover, à démolir.",
  meuble: "Slug ou libellé français : meublé, semi-meublé, non meublé.",
  orientation: "Slug ou libellé français : nord, sud, est, ouest, nord-est…",
  disponibilite: "Slug ou libellé français : immédiate, sous 1 mois, sous 3 mois, sous 6 mois, à la livraison.",

  a_la_une: "oui/non — met le bien en avant.",
  bonne_affaire: "oui/non.",
  coup_de_coeur: "oui/non.",
  exclusif: "oui/non — mandat exclusif.",

  description_courte: "240 caractères max.",
  description_complete: "4000 caractères max.",
  tags: "Slugs ou libellés séparés par « | », doivent exister dans la taxonomie des tags.",

  statut: "disponible, réservé, vendu, loué, retiré. Par défaut : disponible.",
  visibilite: "PUBLIC, OFF_MARKET ou PRIVE. Par défaut : PUBLIC.",

  image_urls: `URLs HTTPS séparées par « | », ${MAX_IMAGE_URLS_PER_ROW} maximum. Seuls les hôtes autorisés (PROPERTY_IMPORT_IMAGE_HOSTS) sont téléchargés ; la première image valide devient la photo principale.`,
};

const detailsColumnLabels: Record<string, string> = {
  d_piscine: "Piscine (oui/non)",
  d_jardin: "Jardin (oui/non)",
  d_dependances: "Dépendances (oui/non)",
  d_rooftop: "Rooftop (oui/non)",
  d_vue: "Vue (texte libre)",
  d_cheminee: "Cheminée (oui/non)",
  d_hammam: "Hammam (oui/non)",
  d_nom_residence: "Nom de la résidence",
  d_ascenseur: "Ascenseur (oui/non)",
  d_position_etage: "rdc / intermediaire / dernier-etage",
  d_terrasse_appt: "A une terrasse (oui/non)",
  d_concierge: "Concierge (oui/non)",
  d_parking_inclus: "Parking inclus (oui/non)",
  d_zonage: "Zonage (texte libre)",
  d_facade_metres: "Façade en mètres",
  d_constructible: "Constructible (oui/non)",
  d_type_titre: "titre-foncier / melkia / requisition-immatriculation",
  d_viabilise: "Viabilisé (oui/non)",
  d_pente_pourcent: "Pente en %",
  d_nombre_chambres_hotel: "Nombre de chambres (hôtel)",
  d_capacite_personnes: "Capacité en personnes",
  d_type_licence: "Type de licence",
  d_restaurant_sur_place: "Restaurant sur place (oui/non)",
  d_spa: "Spa (oui/non)",
  d_taux_occupation_pourcent: "Taux d'occupation en %",
  d_revenu_indicatif: "Revenu indicatif (usage interne)",
  d_type_activite: "Type d'activité",
  d_surface_vente: "Surface de vente en m²",
  d_surface_stockage: "Surface de stockage en m²",
  d_type_bail: "Type de bail",
  d_loyer_mensuel: "Loyer mensuel",
  d_frequentation: "faible / moyen / eleve",
  d_licence: "Licence",
  d_openspace: "Open space (oui/non)",
  d_salles_reunion: "Nombre de salles de réunion",
  d_quai_chargement: "Quai de chargement (oui/non)",
  d_hauteur_plafond: "Hauteur sous plafond en mètres",
  d_securite: "Sécurité (texte libre)",
  d_acces_camion: "Accès camion (oui/non)",
  d_promoteur: "Nom du promoteur",
  d_nom_programme: "Nom du programme",
  d_phase: "Phase",
  d_date_livraison: "Date de livraison",
  d_typologie: "Typologie",
  d_numero_lot: "Numéro de lot",
  d_lots_disponibles: "Lots disponibles",
};

const groupLabels: Record<string, string> = {
  "villa-maison-riad": "Villa / Maison / Riad",
  "appartement-duplex-penthouse": "Appartement / Duplex / Penthouse",
  terrain: "Terrain",
  "hotel-maison-hotes": "Hôtel / Maison d'hôtes",
  "commerce-bureau-depot": "Commerce / Bureau / Dépôt",
  "programme-neuf": "Programme neuf",
};

function ColumnTable({ columns }: { columns: readonly string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
            <th className="px-3 py-2">Colonne</th>
            <th className="px-3 py-2">Requis</th>
            <th className="px-3 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => (
            <tr key={column} className="border-b border-anthracite-50 last:border-0">
              <td className="px-3 py-2 font-mono text-xs text-anthracite-900">{column}</td>
              <td className="px-3 py-2 text-anthracite-600">{(REQUIRED_IMPORT_COLUMNS as readonly string[]).includes(column) ? "Oui" : "Non"}</td>
              <td className="px-3 py-2 text-anthracite-600">{columnDescriptions[column] ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, columns }: { title: string; columns: readonly string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-anthracite-900">{title}</h3>
      <ColumnTable columns={columns} />
    </div>
  );
}

export default function ImportMappingGuide() {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-anthracite-100 bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold text-anthracite-950">Guide de mapping CSV</h2>
        <p className="text-sm text-anthracite-500">
          Seules les colonnes <code>{REQUIRED_IMPORT_COLUMNS.join(", ")}</code> doivent être présentes dans le
          fichier — les autres colonnes documentées ci-dessous peuvent être absentes (traitées comme vides sur
          chaque ligne). Une colonne hors de cette liste est tolérée mais ignorée, et signalée dans le rapport
          d&apos;import. {MAX_IMPORT_ROWS} lignes maximum par fichier. Tout bien créé est enregistré en{" "}
          <strong>brouillon</strong>, jamais publié automatiquement.
        </p>
      </div>

      <Section title="Identification" columns={CORE_COLUMNS} />
      <Section title="Localisation & carte" columns={LOCATION_COLUMNS} />
      <Section title="Commercial" columns={COMMERCIAL_COLUMNS} />
      <Section title="Surfaces" columns={SURFACE_COLUMNS} />
      <Section title="Pièces" columns={ROOM_COLUMNS} />
      <Section title="État" columns={CONDITION_COLUMNS} />
      <Section title="Marketing" columns={MARKETING_COLUMNS} />
      <Section title="Contenu" columns={CONTENT_COLUMNS} />
      <Section title="Statut & visibilité" columns={STATUS_COLUMNS} />
      <Section title="Images" columns={IMAGE_COLUMNS} />

      <div className="flex flex-col gap-2 border-t border-anthracite-100 pt-4">
        <h3 className="text-sm font-semibold text-anthracite-900">
          Caractéristiques par type de bien (colonnes <code>d_*</code>)
        </h3>
        <p className="text-sm text-anthracite-500">
          Ces colonnes sont partagées par tous les types dans le fichier — seules celles correspondant au{" "}
          <code>type_bien</code> de la ligne sont lues, le reste est ignoré. Les champs non fournis restent vides.
        </p>
      </div>
      {(Object.keys(DETAILS_COLUMNS_BY_GROUP) as (keyof typeof DETAILS_COLUMNS_BY_GROUP)[]).map((group) => (
        <div key={group} className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-anthracite-900">{groupLabels[group]}</h4>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-anthracite-100 text-xs font-semibold uppercase tracking-wider text-anthracite-400">
                  <th className="px-3 py-2">Colonne</th>
                  <th className="px-3 py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                {DETAILS_COLUMNS_BY_GROUP[group].map(({ column }) => (
                  <tr key={column} className="border-b border-anthracite-50 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-anthracite-900">{column}</td>
                    <td className="px-3 py-2 text-anthracite-600">{detailsColumnLabels[column] ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <p className="border-t border-anthracite-100 pt-4 text-xs text-anthracite-400">
        Images : {MAX_PHOTOS_PER_PROPERTY} photos maximum par bien (existantes + importées), 25 Mo par image,
        JPEG/PNG/WebP uniquement, EXIF/GPS supprimés automatiquement. Aucune vidéo, PDF, SVG ou GIF n&apos;est
        jamais téléchargé. Les champs SEO (méta-titre/description) ne sont pas encore importables — le modèle de
        données ne les porte pas dans cette phase.
      </p>
    </div>
  );
}
