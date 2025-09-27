import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const systemColorScheme = _useColorScheme() ?? 'light';
  const [colorScheme, setColorScheme] = useState(systemColorScheme);

  useEffect(() => {
    setColorScheme(systemColorScheme);
  }, [systemColorScheme]);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProviderWrapper');
  }
  return context;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const { colorScheme } = useTheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }}/>      
        <Stack.Screen name="Alterar_senha" options={{ title: 'Alterar Senha' }} />
      </Stack>      
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {  
  return (
    <ThemeProviderWrapper>
      <AppContent />
    </ThemeProviderWrapper>
  );
}
