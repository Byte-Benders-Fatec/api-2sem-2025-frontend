import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MaskInput from "react-native-mask-input";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface UserData {
    name: string;
    phone: string;
    address: string;
    email: string;
    avatar: string; // url da imagem
}

const phoneMask = ['(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [isEditing, setIsEditing] = useState(false);
    
    const [userData, setUserData] = useState<UserData>({
        name: "",
        phone: "",
        address: "",
        email: "",
        avatar: "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png",
    });

    const [tempUserData, setTempUserData] = useState<UserData>(userData);

    const handleEdit = () => {
        setTempUserData(userData);
        setIsEditing(true);
    };

    const handleSave = () => {
        //lógica de API para salvar os dados viria aqui
        //ex: await api.updateUser(tempUserData);
        setUserData(tempUserData);
        setIsEditing(false);
        Alert.alert("Sucesso", "Dados salvos com sucesso!");
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    //navega para tela de alteração de senha usando o expo router
    const handleChangePassword = () => {
        router.push("/Alterar_senha");
    };

    //função para atualizar o estado temporario
    const handleInputChange = (field: keyof UserData, value: string) => {
        setTempUserData(prevState => ({
            ...prevState,
            [field]: value,
        }));
    };

    const handlePickimage = async () => {
        // pedir permissão para acessar a galeria
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
            return;
        }
        // abrir a galeria para selecionar uma imagem
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, //permite recorte da imagem
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            handleInputChange('avatar', result.assets[0].uri);
        }
    };

    // Calcular padding bottom suficiente (inset + espaço extra para a tab bar)
    const bottomPadding = Math.max(insets.bottom + 120, 140); // ajuste caso sua tab bar seja maior/menor

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar do usuário */}
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: isEditing ? tempUserData.avatar : userData.avatar }}
                            style={styles.avatar}
                        />
                        {isEditing && (
                            <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickimage}>
                                <MaterialIcons name="camera-alt" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                        
                    <Text style={styles.title}>Perfil do Usuário</Text>

                    {/*campo nome*/}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Nome Completo</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={tempUserData.name}
                                onChangeText={(text) => handleInputChange("name", text)}
                                placeholder="Seu nome completo"
                            />
                        ) : (
                            <Text style={styles.value}>{userData.name}</Text>
                        )}
                    </View>

                    {/*campo telefone*/}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Telefone</Text>
                        {isEditing ? (
                            <MaskInput
                                style={styles.input}
                                value={tempUserData.phone}
                                onChangeText={(masked, unmasked) => {
                                    handleInputChange('phone', masked)
                                }}
                                mask={phoneMask}
                                keyboardType="phone-pad"
                                placeholder="(99) 9999-9999"
                            />
                        ) : (
                            <Text style={styles.value}>{userData.phone}</Text>
                        )}
                    </View>

                    {/* Campo Endereço */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Endereço</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, { minHeight: 80 }]}
                                value={tempUserData.address}
                                onChangeText={(text) => handleInputChange('address', text)}
                                placeholder="Seu endereço completo"
                                multiline
                            />
                        ) : (
                            <Text style={styles.value}>{userData.address}</Text>
                        )}
                    </View>

                    {/* Campo E-mail */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>E-mail</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={tempUserData.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                placeholder="seuemail@exemplo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        ) : (
                            <Text style={styles.value}>{userData.email}</Text>
                        )}
                    </View>

                    {/* Botões de Ação */}
                    <View style={styles.buttonContainer}>
                        {isEditing ? (
                            <>
                                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                                    <Text style={styles.buttonText}>Salvar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
                                    <Text style={styles.buttonText}>Editar Perfil</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.passwordButton]} onPress={handleChangePassword}>
                                    <Text style={styles.buttonText}>Alterar Senha</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7FA',
  },

  keyboardAvoidingContainer: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 18 : 12,
    paddingBottom: 24, 
    minHeight: '100%',
    justifyContent: 'flex-start',
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
    textAlign: 'left',
    paddingLeft: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#2563EB', // azul profissional
    backgroundColor: '#fff',
  },
editAvatarButton: { 
    position: 'absolute', 
    bottom: 0, 
    right: '30%', 
    backgroundColor: '#007BFF', 
    padding: 8, borderRadius: 20,
    borderWidth: 2, 
    borderColor: 'white',
  },
  fieldContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E9EE',
  },
  input: {
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E6E9EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    marginTop: 18,
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: '#2563EB', 
    shadowColor: '#2563EB',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginBottom: 6,
  },

  // Botão secundário: Alterar Senha (contornado, discreto)
  passwordButton: {
    backgroundColor: '#6c757d',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  passwordButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },

  // Botões de salvar/cancelar (quando em edição) — estilos claros e compactos
  saveButton: {
    backgroundColor: '#10B981', // verde
  },
  cancelButton: {
    backgroundColor: '#EF4444', // vermelho
  },

  // texto branco nos botões primários e texto escuro no secundário
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // espaçador final (caso precise de fallback)
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 80 : 64,
  },
});
