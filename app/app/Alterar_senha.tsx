import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as api from '@/lib/api';

export default function ChangePasswordScreen() {
  const router = useRouter();

  // fluxo em duas etapas
  const [step, setStep] = useState<'start' | 'verify'>('start');
  const [isLoading, setIsLoading] = useState(false);

  // campos
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  // visibilidade
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const validatePasswords = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'A nova senha e a confirmação não correspondem.');
      return false;
    }
    if (newPassword.length < 8) {
      Alert.alert('Senha Fraca', 'A nova senha deve ter pelo menos 8 caracteres.');
      return false;
    }
    return true;
  };

  // Etapa 1: inicia a troca (envia código)
  const handleStartChange = async () => {
    if (!validatePasswords()) return;

    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        router.replace('/login');
        return;
      }

      // const res = await fetch(`${API_BASE_URL}/auth/start-change-password`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     current_password: currentPassword,
      //     new_password: newPassword,
      //     confirm_password: confirmPassword,
      //   }),
      // });

      const data = await api.postJson(
        '/auth/start-change-password',
        { current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
      );

      setStep('verify');
      Alert.alert('Código enviado', 'Verifique seu e-mail e informe o código.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível iniciar a alteração.');
    } finally {
      setIsLoading(false);
    }
  };

  // Etapa 2: confirma com o código
  const handleFinalizeChange = async () => {
    if (!code) {
      Alert.alert('Erro', 'Informe o código recebido por e-mail.');
      return;
    }
    if (!validatePasswords()) return;

    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        router.replace('/login');
        return;
      }

      const data = await api.postJson(
        '/auth/change-password',
        { current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
          code,
        },
      );

      Alert.alert('Sucesso!', 'Sua senha foi alterada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível concluir a alteração.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>
            {step === 'start' ? 'Alterar Senha' : 'Confirmar Alteração'}
          </Text>

          {/* senha atual */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Senha Atual"
              secureTextEntry={!isCurrentPasswordVisible}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}>
              <MaterialIcons name={isCurrentPasswordVisible ? 'visibility-off' : 'visibility'} size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* nova senha */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Nova Senha"
              secureTextEntry={!isNewPasswordVisible}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}>
              <MaterialIcons name={isNewPasswordVisible ? 'visibility-off' : 'visibility'} size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* confirmar nova senha */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar Nova Senha"
              secureTextEntry={!isConfirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
              <MaterialIcons name={isConfirmPasswordVisible ? 'visibility-off' : 'visibility'} size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {step === 'start' ? (
            <TouchableOpacity style={styles.button} onPress={handleStartChange} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar Código</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                style={[styles.input, { borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff' }]}
                placeholder="Código de Verificação"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity style={styles.button} onPress={handleFinalizeChange} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmar</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#fff', borderColor: '#d1d5db', borderWidth: 1, marginTop: 12 }]}
                onPress={() => setStep('start')}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, { color: '#374151' }]}>Voltar</Text>
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
  keyboardAvoidingContainer: { flex: 1 },
  container: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 40, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 15, marginBottom: 20, backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 18, paddingVertical: 12, color: '#333' },
  button: {
    backgroundColor: '#007BFF', paddingVertical: 15, borderRadius: 8,
    alignItems: 'center', marginTop: 20,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
