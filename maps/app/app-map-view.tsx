import React, { useState, useEffect, useCallback } from 'react';
import { View, Alert, StyleSheet, Platform } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';

interface Property {
  _id: string;
  geometry: {
    coordinates: number[][][];
  };
  properties: {
    cod_imovel: string;
    municipio: string;
    num_area: number;
  };
  center: { lat: number; lng: number };
}

const AppMapView = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [region, setRegion] = useState({
    latitude: -21.5282835667493,
    longitude: -51.0882115351977,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(false);

  const getBackendUrl = () => {
    return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
  };

  const fetchProperties = useCallback(async (lat: number, lng: number) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Pegando as propriedades do backend:', getBackendUrl());
      console.log('Centro do mapa atual:', lat, lng);
      
      const response = await fetch(
        `${getBackendUrl()}/api/properties?lat=${lat}&lng=${lng}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Propriedades recebidas:', data.length);
      
      setProperties(data);
    } catch (error) {
      console.error('Erro de Fetch:', error);
      Alert.alert(
        'Erro de conexão',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchProperties(region.latitude, region.longitude);
  }, []);

  const handleRegionChangeComplete = useCallback((newRegion: any) => {
    console.log('Região alterada para:', newRegion.latitude, newRegion.longitude);
    setRegion(newRegion);
    
    fetchProperties(newRegion.latitude, newRegion.longitude);
  }, [fetchProperties]);

  const convertCoordinates = (coordinates: number[][][]) => {
    return coordinates[0].map(coord => ({
      latitude: coord[1],
      longitude: coord[0],
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
        {properties.map((property, index) => (
          <Polygon
            key={property._id}
            coordinates={convertCoordinates(property.geometry.coordinates)}
            fillColor={`rgba(${100 + index * 50}, 100, 200, 0.3)`}
            strokeColor={`rgba(${100 + index * 50}, 100, 200, 0.8)`}
            strokeWidth={2}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default AppMapView;
