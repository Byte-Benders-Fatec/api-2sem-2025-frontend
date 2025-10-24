import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    TouchableOpacity, 
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChangePasswordScreen() {
    const router = useRouter();

    // estados para campos de senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // estados para controle de visibilidade das senhas
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // função principal para atulizar a senha
    const handleUpdatePassword = () => {
        // Validação dos campos
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Erro', 'A nova senha e a confirmação não correspondem.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Senha Fraca', 'A nova senha deve ter pelo menos 8 caracteres.');
            return;
        }

        // Lógica de chamada à API (simulada)
        // Substituir esta lógica pela chamada real à API final
        // Ex: api.changePassword({ currentPassword, newPassword })
        //      .then(() => { ... })
        //      .catch((error) => { Alert.alert('Erro', error.message); });
        
        console.log('Enviando para a API:', { currentPassword, newPassword });

        // Feedback de sucesso e navegação
        Alert.alert(
            'Sucesso!',
            'Sua senha foi alterada com sucesso.',
            [{ text: 'OK', onPress: () => router.back() }] // Volta para a tela de perfil
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >

            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Alterar Senha</Text>
                
                {/* campo senha atual */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Senha Atual"
                        secureTextEntry={!isCurrentPasswordVisible} // Oculta o texto
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <TouchableOpacity onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}>
                        <MaterialIcons 
                            name={isCurrentPasswordVisible ? 'visibility-off' : 'visibility'} 
                            size={24} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                </View>

                {/* campo nova senha */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nova Senha"
                        secureTextEntry={!isNewPasswordVisible}
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}>
                        <MaterialIcons 
                            name={isNewPasswordVisible ? 'visibility-off' : 'visibility'} 
                            size={24} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                </View>

                {/* campo confirmar nova senha */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Confirmar Nova Senha"
                        secureTextEntry={!isConfirmPasswordVisible}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                        <MaterialIcons 
                            name={isConfirmPasswordVisible ? 'visibility-off' : 'visibility'} 
                            size={24} 
                            color="#666" 
                        />
                    </TouchableOpacity>
                </View>

                {/* botao de salvar */}
                <TouchableOpacity style={styles.button} onPress={handleUpdatePassword}>
                    <Text style={styles.buttonText}>Salvar Alterações</Text>
                </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB', // tom suave e profissional para o fundo
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  /* Cabeçalho */
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0B2545', 
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#51607A',
    textAlign: 'center',
    marginBottom: 18,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#0B2545',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFDFF',
    borderWidth: 1,
    borderColor: '#E6EEF9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: '#162232',
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },

  /* Texto de ajuda / validação */
  helperText: {
    fontSize: 12,
    color: '#718096',
    marginTop: -6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  /* Indicador de força da senha (opcional) */
  strengthBarContainer: {
    height: 6,
    backgroundColor: '#F0F4F8',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 12,
  },
  strengthBar: {
    height: 6,
    borderRadius: 6,
    width: '25%', // varíavel: ajuste em runtime conforme força
  },
  strengthWeak: { backgroundColor: '#FF6B6B', width: '33%' },
  strengthMedium: { backgroundColor: '#F6C34B', width: '66%' },
  strengthStrong: { backgroundColor: '#33C38D', width: '100%' },

  /* Botões */
  button: {
    backgroundColor: '#0B61FF', // azul profissional e vivo
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    // sombra leve
    shadowColor: '#0B61FF',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Botão secundário / link */
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E6EEF9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonGhostText: {
    color: '#0B2545',
    fontSize: 15,
    fontWeight: '600',
  },

  /* Rodapé / nota */
  note: {
    fontSize: 12,
    color: '#93A0B4',
    textAlign: 'center',
    marginTop: 14,
  },

  /* Pequenos ajustes responsivos */
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },

  /* Estilos reutilizáveis para estados */
  disabled: {
    opacity: 0.6,
  },
});
