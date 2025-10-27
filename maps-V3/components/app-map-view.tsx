import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import MapView, { Polygon, Region, Marker, Callout } from 'react-native-maps';
import { fetchImoveisViewport } from '../lib/geoApi';
import SearchPlaces from './SearchPlaces';

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

const AppMapView = () => {
  const mapRef = useRef<MapView | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: -21.5282835667493,
    longitude: -51.0882115351977,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(false);

  // estado do PIN selecionado
  const [selected, setSelected] = useState<{
    lat: number;
    lng: number;
    description?: string;
  } | null>(null);

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
      const raw = await fetchImoveisViewport({
        bbox,
        limit: 200,
        mode: 'intersects',
      });
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

  const convertCoordinates = (coordinates: number[][][]) => {
    // assume Polygon com primeira "ring" no índice 0
    return coordinates[0].map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));
  };

  // Centraliza o mapa em um novo ponto + dispara busca por viewport + posiciona PIN
  const animateTo = (lat: number, lng: number, description?: string) => {
    const next: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
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

        {/* PIN selecionado */}
        {selected && (
          <Marker coordinate={{ latitude: selected.lat, longitude: selected.lng }}>
            <Callout>
              <View style={{ maxWidth: 260 }}>
                <View>
                  {/* título/linha 1 */}
                </View>
                <View>
                  {/* descrição */}
                </View>
              </View>
              {/* para simplificar, texto direto */}
              {/* Você pode estilizar melhor com Views/Text */}
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Barra de busca (Google Places via fetch) */}
      <SearchPlaces
        placeholder="Buscar endereço ou lugar..."
        country="BR"
        onPlaceSelected={(p: any) => {
          // compatível com versões que mandam { lat, lng } ou { lat, lng, description }
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
