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
        backgroundColor: '#f4f4f8',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 40,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        fontSize: 18,
        paddingVertical: 12,
        color: '#333',
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});