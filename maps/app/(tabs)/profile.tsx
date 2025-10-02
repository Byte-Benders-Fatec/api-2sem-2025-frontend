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
import { SafeAreaView } from "react-native-safe-area-context";

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
        //router.push levará o usuário para a rota '/change-password'
        //preciso criar o arquivo app/change-password.tsx para essa rota funcionar
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
            aspect: [1, 1], //
            quality: 1,
        });
        if (!result.canceled) {
            handleInputChange('avatar', result.assets[0].uri);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
            <ScrollView contentContainerStyle={styles.container}>
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
                            style={styles.input}
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
        backgroundColor: '#f4f4f8',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    container: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
        textAlign: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60, // Metade da largura/altura para fazer um círculo
        borderWidth: 3,
        borderColor: '#007BFF',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: '30%', // Ajuste para centralizar o botão na imagem
        backgroundColor: '#007BFF',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    value: {
        fontSize: 18,
        color: '#333',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    input: {
        fontSize: 18,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    buttonContainer: {
        marginTop: 30,
    },
    button: {
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    editButton: {
        backgroundColor: '#007BFF', // Azul
    },
    passwordButton: {
        backgroundColor: '#6c757d', // Cinza
    },
    saveButton: {
        backgroundColor: '#28a745', // Verde
    },
    cancelButton: {
        backgroundColor: '#dc3545', // Vermelho
    },
});