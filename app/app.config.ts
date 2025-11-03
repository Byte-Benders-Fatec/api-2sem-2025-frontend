import 'dotenv/config';
import type { ExpoConfig } from '@expo/config';
import { api } from './lib/api';

const config: ExpoConfig = {
  name: 'maps-V3',
  slug: 'maps-V3',
  version: '1.0.0',
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    apiGeoBaseUrl: process.env.EXPO_PUBLIC_GEO_API_BASE_URL,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: ['ACCESS_FINE_LOCATION'],
  },
  ios: {
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Usamos sua localização para mostrar propriedades próximas.',
    },
  },
  plugins: [
    ['expo-build-properties', {
      android: {
        usesCleartextTraffic: true, // ✅ habilita HTTP no Android
      },
    }],
    'expo-secure-store', // (se você já estiver usando)
  ],
};

export default config;
