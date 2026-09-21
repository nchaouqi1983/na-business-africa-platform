"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { cityCenter, districtCenter } from "@/lib/admin/geo-taxonomy";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Morocco-wide default view, used until the admin has picked precise coordinates.
const DEFAULT_CENTER: [number, number] = [-7.5898, 33.5731];
const DEFAULT_ZOOM = 5;
const PIN_ZOOM = 14;
const DISTRICT_ZOOM = 15;
const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

type GeocodeContextEntry = { id: string; text: string };

type GeocodeFeature = {
  id: string;
  place_name: string;
  text: string;
  place_type: string[];
  center: [number, number];
  context?: GeocodeContextEntry[];
};

type SuggestedFields = { city?: string; district?: string; addressPublic?: string };

type PropertyLocationMapProps = {
  latitude?: number;
  longitude?: number;
  city: string;
  district: string;
  /** Whether the "Localisation & carte" tab is currently shown — used to resize the map once it becomes visible. */
  active: boolean;
  onLocationChange: (latitude: number, longitude: number) => void;
  /** Clears latitude/longitude, e.g. after the admin confirms resetting the pin on a city change. */
  onResetPin: () => void;
  /** Prefills city/district/addressPublic — the parent only applies a field if it is currently empty. */
  onSuggestPlace: (fields: SuggestedFields) => void;
};

function contextText(feature: GeocodeFeature, prefix: string): string | undefined {
  return feature.context?.find((entry) => entry.id.startsWith(prefix))?.text;
}

function extractPlaceFields(feature: GeocodeFeature): SuggestedFields {
  const types = feature.place_type ?? [];
  if (types.includes("place")) {
    return { city: feature.text };
  }
  if (types.includes("neighborhood") || types.includes("locality")) {
    return { district: feature.text, city: contextText(feature, "place.") };
  }
  return {
    addressPublic: feature.place_name,
    district: contextText(feature, "neighborhood.") ?? contextText(feature, "locality."),
    city: contextText(feature, "place."),
  };
}

export default function PropertyLocationMap({
  latitude,
  longitude,
  city,
  district,
  active,
  onLocationChange,
  onResetPin,
  onSuggestPlace,
}: PropertyLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const onChangeRef = useRef(onLocationChange);
  const onResetPinRef = useRef(onResetPin);
  const onSuggestPlaceRef = useRef(onSuggestPlace);
  useEffect(() => {
    onChangeRef.current = onLocationChange;
    onResetPinRef.current = onResetPin;
    onSuggestPlaceRef.current = onSuggestPlace;
  });

  const hasPin = latitude !== undefined && longitude !== undefined;
  const hasPinRef = useRef(hasPin);
  useEffect(() => {
    hasPinRef.current = hasPin;
  });

  const cityRef = useRef(city);
  const districtRef = useRef(district);
  useEffect(() => {
    cityRef.current = city;
    districtRef.current = district;
  });

  // Suggested-field prefills that originate from inside the map (search pick,
  // geolocation, click/drag reverse geocode) must not re-trigger the
  // ville/quartier → camera sync effects below, or the camera would jump
  // away from the precise spot the admin just picked.
  const suppressCityEffectRef = useRef(false);
  const suppressDistrictEffectRef = useRef(false);

  function suggestPlace(fields: SuggestedFields) {
    if (fields.city && !cityRef.current.trim()) suppressCityEffectRef.current = true;
    if (fields.district && !districtRef.current.trim()) suppressDistrictEffectRef.current = true;
    onSuggestPlaceRef.current(fields);
  }

  const reverseAbortRef = useRef<AbortController | null>(null);

  async function suggestFromCoordinates(lat: number, lng: number) {
    if (!MAPBOX_TOKEN) return;
    reverseAbortRef.current?.abort();
    const controller = new AbortController();
    reverseAbortRef.current = controller;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=fr&types=address,neighborhood,locality,place`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return;
      const data = await res.json();
      const feature: GeocodeFeature | undefined = data.features?.[0];
      if (feature) suggestPlace(extractPlaceFields(feature));
    } catch {
      // Best-effort suggestion only — a failed reverse lookup never blocks placing the pin.
    }
  }

  function placeMarker(lat: number, lng: number, { fly = false }: { fly?: boolean } = {}) {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([lng, lat]).addTo(map);
    if (fly) map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), PIN_ZOOM) });
    onChangeRef.current(lat, lng);
  }

  // --- Map creation (once) + container resize handling ---
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const hasCoords = latitude !== undefined && longitude !== undefined;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: hasCoords ? [longitude, latitude] : DEFAULT_CENTER,
      zoom: hasCoords ? PIN_ZOOM : DEFAULT_ZOOM,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ color: "#c8a032", draggable: true });
    if (hasCoords) marker.setLngLat([longitude, latitude]).addTo(map);
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      onChangeRef.current(lat, lng);
      void suggestFromCoordinates(lat, lng);
    });
    markerRef.current = marker;

    map.on("click", (event) => {
      const { lat, lng } = event.lngLat;
      placeMarker(lat, lng);
      void suggestFromCoordinates(lat, lng);
    });

    // The container can be 0×0 at creation time (e.g. mounted inside a
    // hidden tab) or change size later (tab switch, sidebar, orientation
    // change). Mapbox never learns about that on its own — resize() must be
    // called explicitly whenever the container's real size changes.
    map.once("load", () => map.resize());
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      map.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Belt-and-suspenders: force a resize once the tab actually becomes
  // visible and the browser has painted the unhidden layout.
  useEffect(() => {
    if (!active) return;
    const map = mapRef.current;
    if (!map) return;
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => map.resize());
    });
    return () => cancelAnimationFrame(raf1);
  }, [active]);

  // Keep the marker and camera in sync when coordinates change from the lat/lng inputs.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    if (latitude === undefined || longitude === undefined) {
      marker.remove();
      return;
    }

    marker.setLngLat([longitude, latitude]).addTo(map);
    map.flyTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), PIN_ZOOM) });
  }, [latitude, longitude]);

  // Ville → carte : recentre la caméra dès qu'une ville connue est choisie.
  // Ne déplace/efface le repère que si l'utilisateur confirme (un repère
  // existant reste sur ses coordonnées tant que rien n'est confirmé).
  const prevCityRef = useRef(city);
  useEffect(() => {
    const previous = prevCityRef.current;
    prevCityRef.current = city;
    if (suppressCityEffectRef.current) {
      suppressCityEffectRef.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map || previous === city) return;

    const match = cityCenter(city);
    if (!match) return;

    map.flyTo({ center: [match.center.lng, match.center.lat], zoom: match.zoom });

    if (hasPinRef.current) {
      const confirmed = window.confirm(
        `Vous avez changé la ville pour « ${city} ». Voulez-vous réinitialiser le repère pour le repositionner sur cette nouvelle ville ?`
      );
      if (confirmed) {
        markerRef.current?.remove();
        onResetPinRef.current();
      }
    }
  }, [city]);

  // Quartier → carte : recentre sur le quartier si ses coordonnées locales
  // sont connues, sinon conserve le centre de la ville.
  const prevDistrictRef = useRef(district);
  useEffect(() => {
    const previous = prevDistrictRef.current;
    prevDistrictRef.current = district;
    if (suppressDistrictEffectRef.current) {
      suppressDistrictEffectRef.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map || previous === district) return;

    const center = districtCenter(city, district);
    if (!center) return;
    map.flyTo({ center: [center.lng, center.lat], zoom: DISTRICT_ZOOM });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district]);

  // --- Address / neighborhood search ---
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeFeature[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  const isQueryTooShort = query.trim().length < MIN_QUERY_LENGTH;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      // Dropdown stays hidden via isQueryTooShort — no need to reset state here.
      return;
    }
    const timer = setTimeout(async () => {
      if (!MAPBOX_TOKEN) return;
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      setSearchState("loading");
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${MAPBOX_TOKEN}&country=ma&language=fr&autocomplete=true&limit=6`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error("network");
        const data = await res.json();
        const features: GeocodeFeature[] = data.features ?? [];
        setSuggestions(features);
        setSearchState(features.length === 0 ? "empty" : "idle");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setSearchState("error");
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSelectSuggestion(feature: GeocodeFeature) {
    const [lng, lat] = feature.center;
    placeMarker(lat, lng, { fly: true });
    suggestPlace(extractPlaceFields(feature));
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  // --- Geolocation ---
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  function handleGeolocate() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoMessage("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setGeoLoading(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        const { latitude: lat, longitude: lng } = position.coords;
        placeMarker(lat, lng, { fly: true });
        void suggestFromCoordinates(lat, lng);
      },
      (error) => {
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoMessage(
            "Autorisation de localisation refusée. Vous pouvez toujours cliquer sur la carte pour placer le repère."
          );
        } else if (error.code === error.TIMEOUT) {
          setGeoMessage("La géolocalisation a expiré. Réessayez ou placez le repère manuellement.");
        } else {
          setGeoMessage("Position indisponible. Placez le repère manuellement sur la carte.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-anthracite-200 bg-anthracite-50 text-center text-xs text-anthracite-400">
        <span>Carte indisponible</span>
        <span>NEXT_PUBLIC_MAPBOX_TOKEN n&apos;est pas configuré.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Let a click on a suggestion register before we hide the list.
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder="Rechercher une adresse, une ville, un quartier au Maroc…"
            className="w-full rounded-xl border border-anthracite-200 px-3 py-2.5 text-sm text-anthracite-900 outline-none transition-colors focus:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-400"
          />
          {showSuggestions &&
            !isQueryTooShort &&
            (searchState === "loading" || suggestions.length > 0 || searchState === "empty" || searchState === "error") && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-anthracite-200 bg-white text-sm shadow-lg"
            >
              {searchState === "loading" && <li className="px-3 py-2 text-xs text-anthracite-400">Recherche…</li>}
              {searchState === "empty" && (
                <li className="px-3 py-2 text-xs text-anthracite-400">Aucun résultat pour cette recherche.</li>
              )}
              {searchState === "error" && (
                <li className="px-3 py-2 text-xs text-red-600">Recherche indisponible (erreur réseau). Réessayez.</li>
              )}
              {suggestions.map((feature) => (
                <li key={feature.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    // Fires before the input's onBlur hides the list.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectSuggestion(feature)}
                    className="block w-full px-3 py-2 text-left text-anthracite-800 hover:bg-anthracite-50"
                  >
                    {feature.place_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoLoading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-anthracite-200 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-anthracite-600 transition-colors hover:bg-anthracite-50 disabled:opacity-60"
        >
          {geoLoading ? "Localisation…" : "Utiliser ma position actuelle"}
        </button>
      </div>
      {geoMessage && <p className="text-xs text-anthracite-500">{geoMessage}</p>}

      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-2xl border border-anthracite-800 sm:h-96 lg:h-[28rem]"
      />
      <p className="text-xs text-anthracite-400">
        Cliquez sur la carte ou déplacez le repère pour définir la position exacte du bien.
      </p>
    </div>
  );
}
