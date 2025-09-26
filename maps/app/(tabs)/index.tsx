import React from 'react';
import { View } from 'react-native';
import AppMapView from '@/components/app-map-view';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AppMapView/>
    </View>
  );
}