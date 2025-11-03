import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polygon, Region, Marker, Callout } from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as api from '@/lib/api';
import { fetchImoveisViewport, createImovelPlusCode } from '../lib/geoApi';
import SearchPlaces from './SearchPlaces';

interface Property {
  _id: string;
  geometry: { coordinates: number[][][] };
  properties?: { cod_imovel?: string; municipio?: string; num_area?: number; };
  center?: { lat: number; lng: number };
}

type NavTarget = { lat: number; lng: number; description?: string } | { search: string };

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

function polygonCentroid(coords: number[][][]): { lat: number; lng: number } | null {
  if (!Array.isArray(coords) || !Array.isArray(coords[0]) || coords[0].length < 3) return null;
  const ring = coords[0];
  let area = 0, cx = 0, cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    area += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const sum = ring.reduce((acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
    return { lat: sum.y / ring.length, lng: sum.x / ring.length };
  }
  cx /= (6 * area); cy /= (6 * area);
  return { lat: cy, lng: cx };
}

function isPlusCode(text: string) {
  const t = text.trim();
  const global = /^[2-9CFGHJMPQRVWX]{2,8}\+[2-9CFGHJMPQRVWX]{2,3}$/i;
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
  const params = new URLSearchParams({ input: text, inputtype: 'textquery', fields: 'geometry,name', key: GOOGLE_KEY });
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

async function resolveTextToLatLng(text: string, opts?: { region?: string; locationBiasPoint?: { lat: number; lng: number } }): Promise<LatLng | null> {
  if (isPlusCode(text)) {
    const byGeo = await geocodeByAddress(text, { region: opts?.region ?? 'br' });
    if (byGeo) return byGeo;
    const byPlaces = await findPlaceByText(text, opts);
    if (byPlaces) return byPlaces;
    return null;
  }
  const byPlaces = await findPlaceByText(text, opts);
  if (byPlaces) return byPlaces;
  const byGeo = await geocodeByAddress(text, { region: opts?.region });
  if (byGeo) return byGeo;
  return null;
}

const AppMapView = ({
  navTarget,
  selectionMode = false,
  selectionPropertyId,
}: {
  navTarget?: NavTarget | null;
  selectionMode?: boolean;
  selectionPropertyId?: string;
}) => {

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: -21.5282835667493,
    longitude: -51.0882115351977,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selected, setSelected] = useState<{ lat: number; lng: number; description?: string } | null>(null);

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => loadViewport(newRegion), 350);
  }, [loadViewport]);

  useEffect(() => {
    loadViewport(region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convertCoordinates = (coordinates: number[][][]) =>
    coordinates[0].map(([lon, lat]) => ({ latitude: lat, longitude: lon }));

  const animateTo = (lat: number, lng: number, description?: string) => {
    const next: Region = { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    mapRef.current?.animateToRegion(next, 600);
    setRegion(next);
    setSelected({ lat, lng, description });
    loadViewport(next);
  };

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
        if (resolved) animateTo(resolved.lat, resolved.lng, resolved.description ?? navTarget.search);
        else Alert.alert('Não encontrado', 'Não foi possível localizar o código informado.');
      }
    })();
  }, [navKey]);

  const handleConfirmSelection = async () => {
    if (!selectionMode) return;
    if (!selectionPropertyId) {
      Alert.alert('Erro', 'Imóvel não identificado.');
      return;
    }
    if (!selected) {
      Alert.alert('Seleção necessária', 'Toque e segure no mapa para escolher um local.');
      return;
    }
    try {
      setIsSubmitting(true);
      console.log('property ID:', selectionPropertyId);
      const data = await api.getJson<{ mongo_property_id: string }>(
        `/user-properties/${selectionPropertyId}/mongo-details`,
      );
      console.log('mongo_property_id:', data.mongo_property_id);
      const mongoPropertyId = data.mongo_property_id;

      const resp = await createImovelPlusCode(mongoPropertyId, {
        latitude: selected.lat,
        longitude: selected.lng,
      });
      Alert.alert('Plus Code criado', 'O Plus Code foi gerado e associado ao imóvel.');
      router.replace('/(tabs)/propriedades'); // volta para a lista
    } catch (err: any) {
      console.error('submit plus-code error:', err);
      Alert.alert('Erro', err?.message ?? 'Falha ao criar Plus Code.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            coordinates={property.geometry.coordinates[0].map(([lon, lat]) => ({
              latitude: lat,
              longitude: lon,
            }))}
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

      {/* Barra de busca */}
      <SearchPlaces
        placeholder="Buscar endereço ou lugar..."
        country="BR"
        initialQuery={('search' in (navTarget ?? {}) && (navTarget as any).search) || ''}
        onPlaceSelected={(p: any) => {
          // compatível com { lat, lng } ou { lat, lng, description }
          const next: Region = {
            latitude: p.lat,
            longitude: p.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          mapRef.current?.animateToRegion(next, 600);
          setRegion(next);
          setSelected({ lat: p.lat, lng: p.lng, description: p.description });
          loadViewport(next);
        }}
      />

      {/* Painel do Plus Code acima da tab bar */}
      {selectionMode && (
        <View pointerEvents="box-none" style={styles.overlayTouchableArea}>
          <View style={[styles.bottomPanel, { bottom: (insets?.bottom ?? 0) + 84 }]}>
            <Text style={styles.panelTitle}>Modo Plus Code</Text>
            <Text style={styles.panelSubtitle}>
              Toque e segure no mapa para escolher o ponto. Depois confirme.
            </Text>

            <View style={styles.panelButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()} disabled={isSubmitting}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnConfirm, !selected && { opacity: 0.6 }]}
                onPress={handleConfirmSelection}
                disabled={!selected || isSubmitting}
              >
                <Text style={styles.btnConfirmText}>Confirmar local</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  overlayTouchableArea: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    // permite tocar no mapa fora do painel
  },

  bottomPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // leve sombra
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  panelTitle: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  panelSubtitle: {
    color: '#eee', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 10,
  },
  panelButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnCancelText: { color: '#FF3B30', fontWeight: '700' },

  btnConfirm: {
    flex: 1,
    backgroundColor: '#28a745',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnConfirmText: { color: '#fff', fontWeight: '700' },
});

export default AppMapView;
