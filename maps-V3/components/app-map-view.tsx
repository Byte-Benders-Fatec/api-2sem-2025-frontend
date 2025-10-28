// components/app-map-view.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, StyleSheet, Text } from 'react-native';
import MapView, { Polygon, Region, Marker, Callout } from 'react-native-maps';
import { fetchImoveisViewport } from '../lib/geoApi';
import SearchPlaces from './SearchPlaces';

// ---- TIPOS -------------------------------------------------

interface Property {
  _id: string;
  geometry: {
    // GeoJSON Polygon: [ [ [lon,lat], [lon,lat], ... ] ]
    coordinates: number[][][];
  };
  properties?: {
    cod_imovel?: string;
    municipio?: string;
    num_area?: number;
  };
  center?: { lat: number; lng: number };
}

type NavTarget =
  | { lat: number; lng: number; description?: string }
  | { search: string };

// ---- HELPERS -----------------------------------------------

function normalizeFromPaged(payload: any): Property[] {
  if (!payload) return [];
  const items = Array.isArray(payload?.items) ? payload.items : [];
  return items.map((f: any) => ({
    _id: f._id || f.id || String(Math.random()),
    geometry: f.geometry,
    properties: f.properties ?? {},
    center: f.center ?? undefined,
  })) as Property[];
}

// Centróide de polígono (shoelace) para GeoJSON Polygon
function polygonCentroid(coords: number[][][]): { lat: number; lng: number } | null {
  if (!Array.isArray(coords) || !Array.isArray(coords[0]) || coords[0].length < 3) return null;
  const ring = coords[0];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const sum = ring.reduce((acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
    return { lat: sum.y / ring.length, lng: sum.x / ring.length };
  }
  cx /= (6 * area);
  cy /= (6 * area);
  return { lat: cy, lng: cx };
}


// Detecta Plus Code (global ou composto). É um regex “bonzinho”, não precisa ser perfeito.
function isPlusCode(text: string) {
  const t = text.trim();
  // Global: ABCD+EF (4~8 chars + ‘+’ + 2~3 chars), ex: 7WF8+MJG
  const global = /^[2-9CFGHJMPQRVWX]{2,8}\+[2-9CFGHJMPQRVWX]{2,3}$/i;
  // Composto: “XXXX+XX Cidade…”, começa com global seguido de contexto
  const compound = /^[2-9CFGHJMPQRVWX]{2,8}\+[2-9CFGHJMPQRVWX]{2,3}\b/i;
  return global.test(t) || compound.test(t);
}

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!;

type LatLng = { lat: number; lng: number; description?: string };

async function geocodeByAddress(text: string, opts?: { region?: string }): Promise<LatLng | null> {
  const params = new URLSearchParams({ address: text, key: GOOGLE_KEY });
  if (opts?.region) params.set('region', opts.region);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === 'OK' && json.results?.length) {
    const r = json.results[0];
    const loc = r.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng, description: r.formatted_address };
  }
  return null;
}

async function findPlaceByText(text: string, opts?: { region?: string; locationBiasPoint?: { lat: number; lng: number } }): Promise<LatLng | null> {
  const params = new URLSearchParams({
    input: text,
    inputtype: 'textquery',
    fields: 'geometry,name',
    key: GOOGLE_KEY,
  });
  if (opts?.region) params.set('region', opts.region);
  if (opts?.locationBiasPoint) {
    const { lat, lng } = opts.locationBiasPoint;
    params.set('locationbias', `point:${lat},${lng}`);
  }
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === 'OK' && json.candidates?.length) {
    const c = json.candidates[0];
    const loc = c.geometry?.location;
    if (loc) return { lat: loc.lat, lng: loc.lng, description: c.name };
  }
  return null;
}

/**
 * Resolve texto para lat/lng:
 * - Se for Plus Code → Geocoding direto (mais confiável)
 * - Senão → Places (Find Place); se falhar → Geocoding fallback
 */
async function resolveTextToLatLng(
  text: string,
  opts?: { region?: string; locationBiasPoint?: { lat: number; lng: number } }
): Promise<LatLng | null> {
  // 1) Plus Code: vai de Geocoding
  if (isPlusCode(text)) {
    const byGeo = await geocodeByAddress(text, { region: opts?.region ?? 'br' });
    if (byGeo) return byGeo;
    // (fallback raro) tenta Places
    const byPlaces = await findPlaceByText(text, opts);
    if (byPlaces) return byPlaces;
    return null;
  }

  // 2) Endereço/termo: tenta Places primeiro
  const byPlaces = await findPlaceByText(text, opts);
  if (byPlaces) return byPlaces;

  // 3) Fallback: Geocoding
  const byGeo = await geocodeByAddress(text, { region: opts?.region });
  if (byGeo) return byGeo;

  return null;
}

// ---- COMPONENTE --------------------------------------------

const AppMapView = ({ navTarget }: { navTarget?: NavTarget | null }) => {
  const mapRef = useRef<MapView | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: -21.5282835667493,
    longitude: -51.0882115351977,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(false);

  // PIN selecionado
  const [selected, setSelected] = useState<{ lat: number; lng: number; description?: string } | null>(null);

  // Converte a region do MapView em bbox: lonMin,latMin,lonMax,latMax
  const regionToBbox = (r: Region) => {
    const minLat = r.latitude - r.latitudeDelta / 2;
    const maxLat = r.latitude + r.latitudeDelta / 2;
    const minLon = r.longitude - r.longitudeDelta / 2;
    const maxLon = r.longitude + r.longitudeDelta / 2;
    return `${minLon},${minLat},${maxLon},${maxLat}`;
  };

  const loadViewport = useCallback(async (r: Region) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const bbox = regionToBbox(r);
      const raw = await fetchImoveisViewport({ bbox, limit: 200, mode: 'intersects' });
      const list = normalizeFromPaged(raw);
      setProperties(list);
    } catch (err: any) {
      console.error('loadViewport error:', err);
      Alert.alert('Erro de conexão', err?.message ?? 'Falha ao buscar imóveis');
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Debounce para evitar muitas requisições
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => loadViewport(newRegion), 350);
  }, [loadViewport]);

  useEffect(() => {
    loadViewport(region); // primeira carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convertCoordinates = (coordinates: number[][][]) =>
    coordinates[0].map(([lon, lat]) => ({ latitude: lat, longitude: lon }));

  // Centraliza + dispara busca + posiciona PIN
  const animateTo = (lat: number, lng: number, description?: string) => {
    const next: Region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    mapRef.current?.animateToRegion(next, 600);
    setRegion(next);
    setSelected({ lat, lng, description });
    loadViewport(next);
  };

  // Permite soltar um PIN com long press (opcional)
  const handleLongPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    animateTo(latitude, longitude, 'Ponto selecionado');
  };

  const navKey = JSON.stringify(navTarget ?? null);

  useEffect(() => {
    (async () => {
      if (!navTarget) return;

      if ('lat' in navTarget && 'lng' in navTarget) {
        animateTo(navTarget.lat, navTarget.lng, navTarget.description);
        return;
      }
      if ('search' in navTarget && navTarget.search) {
        const resolved = await resolveTextToLatLng(navTarget.search, { region: 'br' });
        if (resolved) {
          animateTo(resolved.lat, resolved.lng, resolved.description ?? navTarget.search);
        } else {
          Alert.alert('Não encontrado', 'Não foi possível localizar o código informado.');
        }
      }
    })();
  }, [navKey]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onLongPress={handleLongPress}
        mapType="standard"
      >
        {Array.isArray(properties) && properties.map((property, index) => (
          <Polygon
            key={property._id ?? `poly-${index}`}
            coordinates={convertCoordinates(property.geometry.coordinates)}
            fillColor={`rgba(${100 + (index % 3) * 50}, 100, 200, 0.3)`}
            strokeColor={`rgba(${100 + (index % 3) * 50}, 100, 200, 0.8)`}
            strokeWidth={2}
          />
        ))}

        {selected && (
          <Marker coordinate={{ latitude: selected.lat, longitude: selected.lng }}>
            <Callout>
              <View style={{ maxWidth: 260 }}>
                <Text style={{ fontWeight: '700', marginBottom: 4 }}>
                  {selected.description ?? 'Local selecionado'}
                </Text>
                <Text>{selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}</Text>
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Barra de busca (Google Places via fetch) */}
      <SearchPlaces
        placeholder="Buscar endereço ou lugar..."
        country="BR"
        initialQuery={('search' in (navTarget ?? {}) && (navTarget as any).search) || ''}
        onPlaceSelected={(p: any) => {
          // compatível com { lat, lng } ou { lat, lng, description }
          animateTo(p.lat, p.lng, p.description);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  map: { flex: 1 },
});

export default AppMapView;
