import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
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
    ActivityIndicator
} from "react-native";
import MaskInput from "react-native-mask-input";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, putJson } from "@/lib/api";
import { loadProfile } from "@/lib/session";

interface UserData {
    id: string;
    name: string;
    email: string;
    cpf: string;
    avatar: string; // url da imagem
    is_active?: number;
    system_role_id?: number;
}

const cpfMask = [/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/];

export default function ProfileScreen() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [userData, setUserData] = useState<UserData>({
        id: "",
        name: "",
        email: "",
        cpf: "",
        avatar: "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png",
    });

    const [tempUserData, setTempUserData] = useState<UserData>(userData);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setIsLoading(true);
            const profile = await loadProfile();
            if (!profile?.id) {
                // Se não tiver perfil salvo, redireciona ou avisa
                // Mas idealmente o layout já protege, ou o usuário acabou de logar
                return;
            }

            // Busca dados atualizados do usuário
            const user = await api<any>(`/users/${profile.id}`);

            // Monta URL da foto (timestamp para evitar cache)
            // Usa variavel de ambiente ou localhost como fallback, igual ao api.ts
            const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
            const photoUrl = `${baseUrl}/userphotos/${profile.id}/view?t=${new Date().getTime()}`;

            const loadedData: UserData = {
                id: user.id,
                name: user.name,
                email: user.email,
                cpf: user.cpf || "",
                avatar: photoUrl,
                is_active: user.is_active,
                system_role_id: user.system_role_id
            };

            setUserData(loadedData);
            setTempUserData(loadedData);
        } catch (error: any) {
            console.error("Erro ao carregar perfil:", error);
            Alert.alert("Erro", "Falha ao carregar dados do perfil.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        setTempUserData(userData);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            // Envia PUT para atualizar
            // Precisamos enviar todos os campos que o backend espera no update, 
            // ou pelo menos os que queremos manter.
            await putJson(`/users/${userData.id}`, {
                name: tempUserData.name,
                email: tempUserData.email,
                cpf: tempUserData.cpf,
                is_active: tempUserData.is_active,
                system_role_id: tempUserData.system_role_id
            });

            // Recarrega para confirmar e atualizar estado
            await loadUserData();
            setIsEditing(false);
            Alert.alert("Sucesso", "Dados salvos com sucesso!");
        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            Alert.alert("Erro", error.message || "Falha ao salvar dados.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempUserData(userData);
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
            aspect: [1, 1], //
            quality: 1,
        });

        if (!result.canceled && result.assets[0].uri) {
            try {
                setIsLoading(true);
                const localUri = result.assets[0].uri;
                const filename = localUri.split('/').pop() || 'profile.jpg';

                // Infere tipo
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                const formData = new FormData();
                // @ts-ignore: React Native FormData espera um objeto com uri, name, type
                formData.append('file', { uri: localUri, name: filename, type });

                // Backend espera PUT em /userphotos/:id
                // Usamos api genérica pois postForm força POST
                await api(`/userphotos/${userData.id}`, {
                    method: 'PUT',
                    formData: formData
                });

                Alert.alert("Sucesso", "Foto de perfil atualizada!");
                // Recarrega dados (vai atualizar timestamp da foto)
                await loadUserData();

            } catch (error: any) {
                console.error("Erro upload foto:", error);
                Alert.alert("Erro", "Falha ao enviar foto.");
                setIsLoading(false); // garante que loading sai se der erro
            }
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.container, styles.centerContent]}>
                    <ActivityIndicator size="large" color="#007BFF" />
                </View>
            </SafeAreaView>
        );
    }

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
                            source={{ uri: userData.avatar }}
                            style={styles.avatar}
                            // Adiciona um placeholder caso falhe ou enquanto carrega
                            defaultSource={require('@/assets/images/react-logo.png')}
                        />
                        {/* Botão de editar foto sempre visível ou só na edição? 
                        No código original era só na edição. 
                        No plano: "Clicar no ícone de câmera".
                        Vou manter só na edição para consistência com o original, 
                        ou deixar sempre se o usuário quiser trocar rápido.
                        O original: {isEditing && (...)}
                        Vou manter assim.
                    */}
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

                    {/* Campo CPF */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>CPF</Text>
                        {isEditing ? (
                            <MaskInput
                                style={styles.input}
                                value={tempUserData.cpf}
                                onChangeText={(masked, unmasked) => {
                                    handleInputChange('cpf', masked) // ou unmasked se o backend preferir limpo
                                }}
                                mask={cpfMask}
                                keyboardType="numeric"
                                placeholder="000.000.000-00"
                            />
                        ) : (
                            <Text style={styles.value}>{userData.cpf}</Text>
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
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton, isSaving && { opacity: 0.7 }]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Salvar</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={handleCancel}
                                    disabled={isSaving}
                                >
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: '#ddd', // cor de fundo enquanto carrega
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