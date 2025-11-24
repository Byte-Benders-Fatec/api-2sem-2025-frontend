import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking, // para abrir links externos como política de privacidade
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/_layout'; // importando o hook de tema
import * as api from '@/lib/api';
import { setAccessToken, refreshSession, clearSession } from '@/lib/session';

import '../../utils/i18n';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap; // garante que o ícone existe
  text: string;
  onPress?: () => void;
  isToggle?: boolean; // para saber se é um botão de alternância
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  children?: React.ReactNode;
};

const SETTINGS_KEY = '@app_settings';

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  text,
  onPress,
  isToggle,
  toggleValue,
  onToggleChange,
  children,
}) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!!isToggle}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={24} color="#007BFF" style={styles.icon} />
        <Text style={styles.rowText}>{text}</Text>
      </View>
      {isToggle ? (
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={toggleValue ? '#007BFF' : '#f4f3f4'}
          onValueChange={onToggleChange}
          value={toggleValue}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {children}
          <Ionicons name="chevron-forward-outline" size={22} color="#ccc" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // idioma
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState('pt'); // 'pt' | 'en' | 'es'
  const [loading, setLoading] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const json = JSON.parse(raw);
          const lang = json.language || 'pt';
          setLanguage(lang);
          if (i18n && i18n.language !== lang) {
            await i18n.changeLanguage(lang).catch(() => {});
          }
        } else {
          // garante que i18n usa a nossa default (pt)
          if (i18n && i18n.language !== 'pt') {
            await i18n.changeLanguage('pt').catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Erro carregando configurações', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function persistLocalLang(lang: string) {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      const json = raw ? JSON.parse(raw) : {};
      json.language = lang;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(json));
    } catch (e) {
      console.warn('Erro salvando configurações', e);
    }
  }

  // quando a linguagem mudar localmente, persiste
  useEffect(() => {
    if (!loading) {
      persistLocalLang(language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, loading]);

  const changeLanguage = async (value: string) => {
    try {
      setLanguage(value);
      if (i18n) {
        await i18n.changeLanguage(value);
      }
      setShowLanguagePicker(false);
      // persistLocalLang será chamado pelo useEffect acima
    } catch (e) {
      console.warn('Erro ao mudar idioma', e);
    }
  };

  const navigateTo = (path: Href) => {
    router.push(path);
  };

  async function handleLogout() {
    if (loggingOut) return;
    try {
      setLoggingOut(true);

      const data = await api.postJson<{ token: string }>('/auth/logout', {});

      // limpa sessão local
      await clearSession();

      // guarda o access_token no SecureStore via session.ts
      await setAccessToken(data.token);

      // Atualiza sessão completa (perfil + geo_api_key) via /auth/me
      await refreshSession();

      router.replace('../../'); // volta pra tela inicial
    } catch (err: any) {
      Alert.alert(t('Erro'), err?.message || t('Não foi possível terminar a sessão.'));
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('Configurações')}</Text>

        {/* --- Secção: Conta --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Conta')}</Text>
          <SettingsRow
            icon="person-circle-outline"
            text={t('Editar Perfil')}
            onPress={() => navigateTo('/(tabs)/profile')} // Navega para a aba de perfil
          />
          <SettingsRow
            icon="lock-closed-outline"
            text={t('Alterar Senha')}
            onPress={() => navigateTo('/Alterar_senha')} // Navega para a tela de alterar senha
          />
        </View>

        {/* --- Secção: Preferências --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Preferências')}</Text>
          <SettingsRow
            icon="notifications-outline"
            text={t('Notificações')}
            isToggle={true}
            toggleValue={notificationsEnabled}
            onToggleChange={setNotificationsEnabled}
          />
          <SettingsRow
            icon="language-outline"
            text={t('Idioma')}
            onPress={() => setShowLanguagePicker((s) => !s)}
          >
            {/* mostra ícone de seleção ou texto curto */}
            <Text style={{ marginRight: 8 }}>{language.toUpperCase()}</Text>
          </SettingsRow>

          {/* picker embutido — aparece quando o usuário tocar em "Idioma" */}
          {showLanguagePicker && (
            <View style={{ backgroundColor: 'white', borderRadius: 10, marginTop: 8, paddingHorizontal: 8 }}>
              <Picker
                selectedValue={language}
                onValueChange={(v) => changeLanguage(String(v))}
                mode="dropdown"
              >
                <Picker.Item label={t('Português (PT)')} value="pt" />
                <Picker.Item label={t('English (EN)')} value="en" />
                <Picker.Item label={t('Español (ES)')} value="es" />
            
              </Picker>
            </View>
          )}
        </View>

        {/* --- Secção: Sobre --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Sobre o App')}</Text>
          <SettingsRow
            icon="shield-checkmark-outline"
            text={t('Política de Privacidade')}
            onPress={() => Linking.openURL('https://expo.dev')}
          />
          <SettingsRow
            icon="document-text-outline"
            text={t('Termos de Serviço')}
            onPress={() => Linking.openURL('https://expo.dev')}
          />
          <SettingsRow
            icon="information-circle-outline"
            text={t('Versão do App')}
            onPress={() => Alert.alert(t('Versão'), t('Versão 1.0.0'))}
          />
        </View>

        {/* --- Secção: Ações --- */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
            {loggingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.logoutButtonText}>{t('Terminar Sessão')}</Text>
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
