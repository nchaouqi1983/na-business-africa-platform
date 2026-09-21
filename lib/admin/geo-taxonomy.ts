export type LatLng = { lat: number; lng: number };

export type DistrictTaxonomyEntry = {
  name: string;
  /** Approximate neighborhood centroid, used only to recenter the map camera — never to auto-place a pin. */
  center?: LatLng;
};

export type CityTaxonomyEntry = {
  city: string;
  /** Approximate city-center coordinates, used only to recenter the map camera — never to auto-place a pin. */
  center: LatLng;
  zoom: number;
  districts: DistrictTaxonomyEntry[];
};

/**
 * Référentiel local extensible pour l'autocomplétion ville/quartier et le
 * centrage automatique de la carte — aucun appel API externe. La saisie
 * libre reste toujours possible côté formulaire : cette liste ne fait
 * qu'alimenter les suggestions et le centrage de la caméra.
 */
export const moroccoCityTaxonomy: CityTaxonomyEntry[] = [
  {
    city: "Marrakech",
    center: { lat: 31.6295, lng: -7.9811 },
    zoom: 12,
    districts: [
      { name: "Hivernage", center: { lat: 31.6275, lng: -8.013 } },
      { name: "Guéliz", center: { lat: 31.642, lng: -8.009 } },
      { name: "Palmeraie", center: { lat: 31.669, lng: -7.949 } },
      { name: "Médina", center: { lat: 31.6295, lng: -7.9811 } },
      { name: "Agdal", center: { lat: 31.611, lng: -8.005 } },
      { name: "Route de l'Ourika" },
      { name: "Amelkis", center: { lat: 31.585, lng: -7.975 } },
      { name: "Targa", center: { lat: 31.655, lng: -8.045 } },
    ],
  },
  {
    city: "Casablanca",
    center: { lat: 33.5731, lng: -7.5898 },
    zoom: 12,
    districts: [
      { name: "Anfa", center: { lat: 33.589, lng: -7.649 } },
      { name: "Californie", center: { lat: 33.547, lng: -7.627 } },
      { name: "Bourgogne", center: { lat: 33.592, lng: -7.615 } },
      { name: "Racine", center: { lat: 33.586, lng: -7.633 } },
      { name: "Ain Diab", center: { lat: 33.592, lng: -7.672 } },
      { name: "Maarif", center: { lat: 33.573, lng: -7.633 } },
      { name: "Gauthier", center: { lat: 33.587, lng: -7.628 } },
      { name: "CIL", center: { lat: 33.568, lng: -7.628 } },
    ],
  },
  {
    city: "Tanger",
    center: { lat: 35.7595, lng: -5.834 },
    zoom: 12,
    districts: [
      { name: "Malabata", center: { lat: 35.783, lng: -5.781 } },
      { name: "Iberia", center: { lat: 35.769, lng: -5.821 } },
      { name: "Centre-ville", center: { lat: 35.778, lng: -5.813 } },
      { name: "California" },
      { name: "Route de Rabat" },
      { name: "Boukhalef", center: { lat: 35.727, lng: -5.908 } },
    ],
  },
  {
    city: "Rabat",
    center: { lat: 34.0209, lng: -6.8416 },
    zoom: 12,
    districts: [
      { name: "Agdal", center: { lat: 34.001, lng: -6.849 } },
      { name: "Hassan", center: { lat: 34.023, lng: -6.833 } },
      { name: "Souissi", center: { lat: 33.98, lng: -6.86 } },
      { name: "Hay Riad", center: { lat: 33.966, lng: -6.86 } },
      { name: "Océan", center: { lat: 34.028, lng: -6.838 } },
      { name: "Aviation", center: { lat: 34.013, lng: -6.848 } },
    ],
  },
  {
    city: "Agadir",
    center: { lat: 30.4278, lng: -9.5981 },
    zoom: 12,
    districts: [
      { name: "Founty", center: { lat: 30.398, lng: -9.568 } },
      { name: "Secteur touristique", center: { lat: 30.413, lng: -9.573 } },
      { name: "Talborjt", center: { lat: 30.421, lng: -9.601 } },
      { name: "Sonaba" },
      { name: "Cité Suisse" },
    ],
  },
  {
    city: "Essaouira",
    center: { lat: 31.5085, lng: -9.7595 },
    zoom: 13,
    districts: [
      { name: "Médina", center: { lat: 31.5125, lng: -9.77 } },
      { name: "Diabat", center: { lat: 31.465, lng: -9.77 } },
      { name: "Ghazoua" },
      { name: "Route d'Agadir" },
    ],
  },
];

export const moroccoCityNames = moroccoCityTaxonomy.map((entry) => entry.city);

function findCity(city: string): CityTaxonomyEntry | undefined {
  const needle = city.trim().toLowerCase();
  if (!needle) return undefined;
  return moroccoCityTaxonomy.find((entry) => entry.city.toLowerCase() === needle);
}

export function districtsForCity(city: string): string[] {
  return findCity(city)?.districts.map((district) => district.name) ?? [];
}

/** City-center coordinates for map recentering, or undefined if the city isn't in the local taxonomy. */
export function cityCenter(city: string): { center: LatLng; zoom: number } | undefined {
  const entry = findCity(city);
  return entry ? { center: entry.center, zoom: entry.zoom } : undefined;
}

/** District-center coordinates for map recentering, or undefined if unknown. */
export function districtCenter(city: string, district: string): LatLng | undefined {
  const needle = district.trim().toLowerCase();
  if (!needle) return undefined;
  return findCity(city)?.districts.find((entry) => entry.name.toLowerCase() === needle)?.center;
}
