import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api'; // seu helper que já injeta o Authorization
import { saveProfile, MeResponse } from '@/lib/session';

import '../utils/i18n';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

export default function LandingScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loadingGuest, setLoadingGuest] = React.useState(false);

  async function handleGuestLogin() {
    try {
      setLoadingGuest(true);

      // 1️⃣ Faz o login do visitante
      const res = await fetch(`${API_BASE_URL}/auth/guest-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || t('Falha ao entrar como visitante.'));
      if (!data?.token) throw new Error(t('Token não retornado pelo servidor.'));

      // 2️⃣ Armazena o token
      await SecureStore.setItemAsync('access_token', data.token);

      // 3️⃣ Busca o perfil completo (para pegar api_key, etc.)
      const me = await api<MeResponse>('/auth/me', { method: 'GET' });
      await saveProfile(me);

      // 4️⃣ Vai para a tela principal
      router.replace('/(tabs)/mapa');
    } catch (err: any) {
      Alert.alert(t('Erro'), err?.message || t('Falha ao entrar como visitante.'));
    } finally {
      setLoadingGuest(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/icon.jpg')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.title}>{t('Bem-vindo')}</Text>
        <Text style={styles.subtitle}>{t('Escolha como deseja acessar')}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleGuestLogin}
            disabled={loadingGuest}
          >
            {loadingGuest ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t('Acessar como visitante')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>{t('Fazer login')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonGhost]}
            onPress={() => router.push('/register')}
          >
            <Text style={[styles.buttonText, styles.buttonTextGhost]}>{t('Realizar cadastro')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const RADIUS = 96;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f7fb' },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: '#e9eef7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },
  logo: { width: '100%', height: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 6, marginBottom: 32 },
  buttons: { width: '100%', gap: 12 },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  buttonPrimary: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  buttonOutline: { backgroundColor: '#fff', borderColor: '#2563eb' },
  buttonGhost: { backgroundColor: '#fff', borderColor: '#d1d5db' },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  buttonTextOutline: { color: '#2563eb' },
  buttonTextGhost: { color: '#374151' },
});
