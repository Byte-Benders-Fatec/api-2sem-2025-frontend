import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AppMapView from '@/components/app-map-view';

type Params = {
  search?: string;
  lat?: string;
  lng?: string;
  description?: string;
  mode?: string;         // "createPlusCode" quando vier da lista
  propertyId?: string;   // id do imóvel
  ts?: string;
};

export default function MapaScreen() {
  const params = useLocalSearchParams<Params>();
  const { search, lat, lng, description, ts, mode, propertyId } = params;

  const navTarget = useMemo(() => {
    const { search, lat, lng, description } = params as Params;

    if (lat && lng) {
      const nlat = Number(lat), nlng = Number(lng);
      if (!Number.isNaN(nlat) && !Number.isNaN(nlng)) {
        return { lat: nlat, lng: nlng, description };
      }
    }
    if (search) {
      return { search: search as string } as const;
    }
    return null;
  }, [search, lat, lng, description, ts]);

  const mapKey =
    ts ? `ts:${ts}` :
    navTarget && 'search' in (navTarget as any) ? `s:${(navTarget as any).search}` :
    navTarget && 'lat' in (navTarget as any) ? `c:${(navTarget as any).lat},${(navTarget as any).lng}` :
    'default';

  const selectionMode = mode === 'createPlusCode';

  return (
    <View style={{ flex: 1 }}>
      <AppMapView
        key={mapKey}
        navTarget={navTarget}
        selectionMode={selectionMode}
        selectionPropertyId={propertyId ? String(propertyId) : undefined}
      />
    </View>
  );
}
