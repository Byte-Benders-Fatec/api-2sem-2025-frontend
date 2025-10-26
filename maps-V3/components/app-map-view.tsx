import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import MapView, { Polygon, Region } from 'react-native-maps';
import { fetchImoveisViewport } from '../lib/geoApi';

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

  // Cada item já é um Feature com geometry/coordinates em [lon, lat]
  return items.map((f: any) => ({
    _id: f._id || f.id || String(Math.random()),
    geometry: f.geometry,
    properties: f.properties ?? {},
    center: f.center ?? undefined,
  })) as Property[];
}

const AppMapView = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: -21.5282835667493,
    longitude: -51.0882115351977,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Transforma region do MapView em bbox: lonMin,latMin,lonMax,latMax
  const regionToBbox = (r: Region) => {
    const minLat = r.latitude - r.latitudeDelta / 2;
    const maxLat = r.latitude + r.latitudeDelta / 2;
    const minLon = r.longitude - r.longitudeDelta / 2;
    const maxLon = r.longitude + r.longitudeDelta / 2;
    // ordem esperada pela API: lonMin,latMin,lonMax,latMax
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
    
      // raw tem { page, pageSize, total, totalPages, items: [...] }
      const list = normalizeFromPaged(raw);
      setProperties(list);
    } catch (err: any) {
      console.error('loadViewport error:', err);
      Alert.alert('Erro de conexão', err?.message ?? 'Falha ao buscar imóveis');
      setProperties([]); // evita quebrar o render
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Debounce simples para evitar requisições em excesso
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => loadViewport(newRegion), 350);
  }, [loadViewport]);

  useEffect(() => {
    loadViewport(region);
  }, []); // primeira carga

  const convertCoordinates = (coordinates: number[][][]) => {
    // assume Polygon com primeira "ring" no índice 0
    return coordinates[0].map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    }));
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
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
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

export default AppMapView;
