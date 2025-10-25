// app/index.tsx
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo em círculo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/icon.jpg')} // ajuste o caminho se seu logo estiver em outra pasta
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        {/* Título / Subtítulo (opcional) */}
        <Text style={styles.title}>Bem-vindo</Text>
        <Text style={styles.subtitle}>Escolha como deseja acessar</Text>

        {/* Botões */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.buttonText}>Acessar como visitante</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>Fazer login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonGhost]}
            onPress={() => router.push('/register')}
          >
            <Text style={[styles.buttonText, styles.buttonTextGhost]}>Realizar cadastro</Text>
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
