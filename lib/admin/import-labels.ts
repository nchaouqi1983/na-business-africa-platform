import type {
  ImportBatchStatus,
  ImportRowStatus,
  ImportSourceType,
} from "@/lib/generated/prisma/enums";

export const importSourceLabels: Record<ImportSourceType, string> = {
  CAPITAL_PARC: "Capital Parc",
  AUTRE: "Autre source",
};

export const importSourceOptions = (Object.keys(importSourceLabels) as ImportSourceType[]).map((value) => ({
  value,
  label: importSourceLabels[value],
}));

export const importBatchStatusLabels: Record<ImportBatchStatus, string> = {
  BROUILLON: "Brouillon",
  VALIDE: "Validé — prêt à importer",
  IMPORTE: "Importé",
  ECHEC: "Échec",
};

export const importRowStatusLabels: Record<ImportRowStatus, string> = {
  VALIDE: "Valide",
  ERREUR: "Erreur",
  IGNORE: "Ignorée",
  IMPORTE: "Importée",
};
