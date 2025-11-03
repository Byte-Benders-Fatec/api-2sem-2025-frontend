import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView,
    Switch,
    Linking // para abrir links externos como política de privacidade
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/_layout'; // importando o hook de tema
import { Alert, ActivityIndicator } from 'react-native';
import * as api from '@/lib/api';
import { setAccessToken, refreshSession, clearSession } from '@/lib/session';

// componente reutilizável para cada linha de opção
type SettingsRowProps = {
    icon: keyof typeof Ionicons.glyphMap; // garante que o ícone existe
    text: string;
    onPress?: () => void;
    isToggle?: boolean; // para saber se é um botão de alternância
    toggleValue?: boolean;
    onToggleChange?: (value: boolean) => void;
};

const SettingsRow: React.FC<SettingsRowProps> = ({ icon, text, onPress, isToggle, toggleValue, onToggleChange }) => {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress} disabled={isToggle}>
            <View style={styles.rowLeft}>
                <Ionicons name={icon} size={24} color="#007BFF" style={styles.icon} />
                <Text style={styles.rowText}>{text}</Text>
            </View>
            {isToggle ? (
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={toggleValue ? "#007BFF" : "#f4f3f4"}
                    onValueChange={onToggleChange}
                    value={toggleValue}
                />
            ) : (
                <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
            )}
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const router = useRouter();
    // o useColorScheme já nos dá o tema atual. vamos usá-lo para o switch.
    const { colorScheme, setColorScheme } = useTheme();

    // estado para o loading do logout
    const [loggingOut, setLoggingOut] = useState(false);

    // estado para o switch de notificações (exemplo)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const navigateTo = (path: Href) => {
        router.push(path);
    };

    async function handleLogout() {
        if (loggingOut) return;
        try {
        setLoggingOut(true);
        
        const data = await api.postJson<{ token: string }>(
            '/auth/logout',
            { },
        );

        // limpa sessão local
        await clearSession();

        // guarda o access_token no SecureStore via session.ts
        await setAccessToken(data.token);

        // Atualiza sessão completa (perfil + geo_api_key) via /auth/me
        await refreshSession();

        router.replace('../../'); // volta pra tela inicial
        } catch (err: any) {
        Alert.alert('Erro', err?.message || 'Não foi possível terminar a sessão.');
        } finally {
        setLoggingOut(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Configurações</Text>

                {/* --- Secção: Conta --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Conta</Text>
                    <SettingsRow 
                        icon="person-circle-outline" 
                        text="Editar Perfil" 
                        onPress={() => navigateTo('/(tabs)/profile')} // Navega para a aba de perfil
                    />
                    <SettingsRow 
                        icon="lock-closed-outline" 
                        text="Alterar Senha" 
                        onPress={() => navigateTo('/Alterar_senha')} // Navega para a tela de alterar senha
                    />
                </View>

                {/* --- Secção: Preferências --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferências</Text>
                    <SettingsRow 
                        icon="contrast-outline" 
                        text="Modo Noturno"
                        isToggle={true}
                        toggleValue={colorScheme === 'dark'}
                        onToggleChange={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                    />
                    <SettingsRow 
                        icon="notifications-outline" 
                        text="Notificações"
                        isToggle={true}
                        toggleValue={notificationsEnabled}
                        onToggleChange={setNotificationsEnabled}
                    />
                    <SettingsRow 
                        icon="language-outline" 
                        text="Idioma" 
                        onPress={() => alert('Lógica para alterar idioma')}
                    />
                </View>

                {/* --- Secção: Sobre --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sobre o App</Text>
                    <SettingsRow 
                        icon="shield-checkmark-outline" 
                        text="Política de Privacidade" 
                        onPress={() => Linking.openURL('https://expo.dev')} // Abre um link externo
                    />
                    <SettingsRow 
                        icon="document-text-outline" 
                        text="Termos de Serviço" 
                        onPress={() => Linking.openURL('https://expo.dev')}
                    />
                    <SettingsRow 
                        icon="information-circle-outline" 
                        text="Versão do App" 
                        onPress={() => alert('Versão 1.0.0')}
                    />
                </View>
                
                {/* --- Secção: Ações --- */}
                <View style={styles.section}>
                    <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    disabled={loggingOut}
                    >
                    {loggingOut ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.logoutButtonText}>Terminar Sessão</Text>
                    )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f4f4f8', // Cor de fundo para modo claro
        // No seu useColorScheme hook, você pode definir uma cor de fundo para o modo escuro
    },
    container: {
        padding: 20,
        paddingBottom: 160,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 10,
        marginLeft: 5,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 15,
    },
    rowText: {
        fontSize: 18,
        color: '#333',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});