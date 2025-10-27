import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as api from '@/lib/api';
import {
  setAccessToken,
  setTempToken,
  refreshSession,
  clearSession,
} from '@/lib/session';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [code, setCode] = useState('');
  const [registerToken, setRegisterToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const maskEmail = (value: string) => {
    const [user, domain] = value.split('@');
    if (!user || !domain) return value;
    const vis = user.slice(0, 2);
    return `${vis}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
  };

  // Etapa 1: dados do usuário -> /auth/register
  const handleRegister = async () => {
    if (!name.trim() || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      // evita estado sujo se houver resquícios de sessão anterior
      await clearSession();

      const data = await api.postJson<{ register_token: string }>(
        '/auth/register',
        { 
          name: name.trim(), 
          email: email.toLowerCase().trim(), 
          password 
        },
        { auth: 'none' }
      );

      setRegisterToken(data.register_token);
      // armazena também no SecureStore via session.ts (padronização)
      await setTempToken(data.register_token);

      setStep('verify');
      Alert.alert('Código enviado', `Enviamos um código de verificação para ${maskEmail(email)}.`);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha no cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2: Authorization: Bearer <register_token> + { email, code }
  const handleFinalizeRegister = async () => {
    if (!code) {
      Alert.alert('Erro', 'Informe o código recebido por e-mail.');
      return;
    }
    if (!registerToken) {
      Alert.alert('Sessão inválida', 'Refaça o cadastro.');
      setStep('register');
      return;
    }

    try {
      setIsLoading(true);

      const data = await api.postJson<{ token: string }>(
        '/auth/finalize-register',
        { email: email.toLowerCase().trim(), code },
        { auth: 'temp' }
      );

      // guarda o access_token no SecureStore via session.ts
      await setAccessToken(data.token);

      // Atualiza sessão completa (perfil + geo_api_key) via /auth/me
      await refreshSession();

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao finalizar cadastro.');
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
            {step === 'register' ? 'Criar Conta' : 'Verificação'}
          </Text>

          {step === 'register' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Senha"
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
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="Confirmar senha"
                  secureTextEntry={!isConfirmPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                >
                  <MaterialIcons
                    name={isConfirmPasswordVisible ? 'visibility-off' : 'visibility'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator /> : <Text style={styles.btnTextPrimary}>Criar Conta</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonGhost}
                onPress={() => router.push('/login')}
                disabled={isLoading}
              >
                <Text style={styles.btnTextGhost}>Já tem conta? Fazer login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.helper}>
                Enviamos um código para <Text style={styles.bold}>{maskEmail(email)}</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Código (6 dígitos)"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={handleFinalizeRegister}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator /> : <Text style={styles.btnTextPrimary}>Verificar Código</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonGhost}
                onPress={() => setStep('register')}
                disabled={isLoading}
              >
                <Text style={styles.btnTextGhost}>Voltar</Text>
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

