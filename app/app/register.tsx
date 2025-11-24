import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import MaskInput from 'react-native-mask-input';
import * as api from '@/lib/api';

const cpfMask = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];

export default function RegisterScreen() {
    const router = useRouter();

    // Estados do formulário
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Estados de controle
    const [step, setStep] = useState<'register' | 'verify'>('register');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const maskEmail = (value: string) => {
        const [user, domain] = value.split('@');
        if (!user || !domain) return value;
        const vis = user.slice(0, 2);
        return `${vis}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
    };

    // Etapa 1: Enviar dados para pré-cadastro
    const handleStartRegister = async () => {
        if (!name || !email || !cpf || !password || !confirmPassword) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não conferem.');
            return;
        }

        try {
            setIsLoading(true);

            // Remove caracteres não numéricos do CPF
            const cleanCpf = cpf.replace(/\D/g, '');

            await api.postJson('/auth/start-register', {
                name,
                email,
                cpf: cleanCpf,
                new_password: password,
                confirm_password: confirmPassword
            });

            setStep('verify');
            Alert.alert('Sucesso', `Código de verificação enviado para ${maskEmail(email)}.`);
        } catch (e: any) {
            Alert.alert('Erro', e?.message || 'Falha ao iniciar cadastro.');
        } finally {
            setIsLoading(false);
        }
    };

    // Etapa 2: Validar código e ativar conta
    const handleFinalizeRegister = async () => {
        if (!code) {
            Alert.alert('Erro', 'Informe o código recebido por e-mail.');
            return;
        }

        try {
            setIsLoading(true);

            await api.postJson('/auth/register', {
                email,
                code
            });

            Alert.alert(
                'Cadastro realizado!',
                'Sua conta foi ativada com sucesso. Faça login para continuar.',
                [
                    { text: 'OK', onPress: () => router.replace('/login') }
                ]
            );
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
                                placeholder="Nome Completo"
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

                            <MaskInput
                                style={styles.input}
                                value={cpf}
                                onChangeText={(masked, unmasked) => setCpf(masked)}
                                mask={cpfMask}
                                keyboardType="numeric"
                                placeholder="CPF (000.000.000-00)"
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
                                    placeholder="Confirmar Senha"
                                    secureTextEntry={!isPasswordVisible}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.buttonPrimary}
                                onPress={handleStartRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextPrimary}>Cadastrar</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.buttonGhost}
                                onPress={() => router.back()}
                                disabled={isLoading}
                            >
                                <Text style={styles.btnTextGhost}>Voltar</Text>
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
                                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextPrimary}>Verificar e Finalizar</Text>}
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
    inputFlex: { flex: 1, marginBottom: 0, paddingHorizontal: 4, paddingVertical: 12 },
    buttonPrimary: {
        backgroundColor: '#007BFF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10
    },
    btnTextPrimary: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    buttonGhost: {
        paddingVertical: 12, borderRadius: 8, alignItems: 'center',
        borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff',
    },
    btnTextGhost: { color: '#374151', fontSize: 15, fontWeight: '600' },
    helper: { textAlign: 'center', color: '#666', marginBottom: 20, fontSize: 16 },
    bold: { fontWeight: '700', color: '#333' },
});
