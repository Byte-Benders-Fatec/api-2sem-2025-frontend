import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as api from '@/lib/api';

import '../utils/i18n'
import { useTranslation } from 'react-i18next';

import {
  setAccessToken,
  setTempToken,
  refreshSession,
  clearSession,
} from '@/lib/session';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [code, setCode] = useState('');
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { t, i18n } = useTranslation();

  const maskEmail = (value: string) => {
    const [user, domain] = value.split('@');
    if (!user || !domain) return value;
    const vis = user.slice(0, 2);
    return `${vis}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
  };

  // Etapa 1: email + senha -> /auth/login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('Erro'), t('Preencha e-mail e senha.'));
      return;
    }

    try {
      setIsLoading(true);
      // evita estado sujo se houver resquícios de sessão anterior
      await clearSession();

      const data = await api.postJson<{ login_token: string }>(
        '/auth/login',
        { email, password },
        { auth: 'none' }
      );

      setLoginToken(data.login_token);
      // armazena também no SecureStore via session.ts (padronização)
      await setTempToken(data.login_token);

      setStep('verify');
      Alert.alert(
        t('Código enviado'),
        t('Enviamos um código para {{email}}.', { email: maskEmail(email) })
      );
    } catch (e: any) {
      Alert.alert(t('Erro'), e?.message || t('Falha no login.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2: Authorization: Bearer <login_token> + { email, code }
  const handleFinalizeLogin = async () => {
    if (!code) {
      Alert.alert(t('Erro'), t('Informe o código recebido por e-mail.'));
      return;
    }
    if (!loginToken) {
      Alert.alert(t('Sessão inválida'), t('Refaça o login.'));
      setStep('login');
      return;
    }

    try {
      setIsLoading(true);

      const data = await api.postJson<{ token: string }>(
        '/auth/finalize-login',
        { email, code },
        { auth: 'temp' }
      );

      // guarda o access_token no SecureStore via session.ts
      await setAccessToken(data.token);

      // Atualiza sessão completa (perfil + geo_api_key) via /auth/me
      await refreshSession();

      Alert.alert(t('Sucesso'), t('Login realizado com sucesso!'));
      router.replace('/(tabs)/mapa');
    } catch (e: any) {
      Alert.alert(t('Erro'), e?.message || t('Falha ao finalizar login.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>
            {step === 'login' ? t('Entrar') : t('Verificação')}
          </Text>

          {step === 'login' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder={t('E-mail')}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder={t('Senha')}
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <MaterialIcons
                    name={isPasswordVisible ? 'visibility-off' : 'visibility'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator /> : <Text style={styles.btnTextPrimary}>{t('Continuar')}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.helper}>
                {t('Enviamos um código para')} <Text style={styles.bold}>{maskEmail(email)}</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t('Código (6 dígitos)')}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleFinalizeLogin}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator /> : <Text style={styles.btnTextPrimary}>{t('Enviar Código')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonGhost}
                onPress={() => setStep('login')}
                disabled={isLoading}
              >
                <Text style={styles.btnTextGhost}>{t('Voltar')}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 15,
    fontSize: 16, marginBottom: 16, color: '#333',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    backgroundColor: '#fff', paddingHorizontal: 12, marginBottom: 16,
  },
  inputFlex: { flex: 1, marginBottom: 0, paddingHorizontal: 4 },
  buttonPrimary: {
    backgroundColor: '#007BFF', paddingVertical: 14, borderRadius: 8, alignItems: 'center',
  },
  btnTextPrimary: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonGhost: {
    marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff',
  },
  btnTextGhost: { color: '#374151', fontSize: 15, fontWeight: '600' },
  helper: { textAlign: 'center', color: '#666', marginBottom: 8 },
  bold: { fontWeight: '700', color: '#333' },
});
