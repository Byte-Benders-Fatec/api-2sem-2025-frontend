import React from 'react';
import { View } from 'react-native';
import Login from '@/app/login';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Login/>
    </View>
  );
}