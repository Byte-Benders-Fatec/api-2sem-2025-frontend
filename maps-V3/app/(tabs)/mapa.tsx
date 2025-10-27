import React, { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AppMapView from '@/components/app-map-view';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ search?: string }>();

  // Exemplo: se você quiser reagir a parâmetros (futuro)
  useEffect(() => {
    if (params.search) {
      const plusCode = params.search;
      Alert.alert(
        'Localizar Propriedade',
        `Exibindo localização para: ${plusCode}`
      );
      // TODO: aqui você pode futuramente conectar com o mapRef para centralizar
    }
  }, [params.search]);

  return (
    <View style={{ flex: 1 }}>
      <AppMapView />
    </View>
  );
}
