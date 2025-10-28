import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AppMapView from '@/components/app-map-view';

export default function MapaScreen() {
  const params = useLocalSearchParams<{ search?: string; lat?: string; lng?: string; description?: string }>();
  const { search, lat, lng, description, ts } = params;

  const navTarget = useMemo(() => {
    const { search, lat, lng, description } = params;

      if (lat && lng) {
        const nlat = Number(lat), nlng = Number(lng);
        if (!Number.isNaN(nlat) && !Number.isNaN(nlng)) {
          return { lat: nlat, lng: nlng, description: description as string | undefined };
        }
      }
      if (search) {
        return { search: search as string } as const; // sem decode
      }
      return null;
  }, [search, lat, lng, description, ts]);

  // (opcional) forçar remount do mapa quando alvo mudar:
  const mapKey =
    ts ? `ts:${ts}` :
    navTarget && 'search' in (navTarget as any) ? `s:${(navTarget as any).search}` :
    navTarget && 'lat' in (navTarget as any) ? `c:${(navTarget as any).lat},${(navTarget as any).lng}` :
    'default';

  return (
    <View style={{ flex: 1 }}>
      <AppMapView key={mapKey} navTarget={navTarget} />
    </View>
  );
}
