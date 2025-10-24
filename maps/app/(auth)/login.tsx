"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { router } from "expo-router"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Colors } from "@/constants/theme"
import AppMapView from '@/app/(tabs)/app-map-view'
import React from "react"
import { Ionicons } from '@expo/vector-icons' // <-- import do ícone
import AsyncStorage from "@react-native-async-storage/async-storage";
interface LoginResponse {
  success: boolean
  message?: string
  user?: {
    id: number
    email: string
    name: string
    role: string
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? "light"]

const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Erro", "Por favor, preencha todos os campos");
    return;
  }

  setLoading(true);

    try {
      const API_BASE_URL = "http://10.0.2.2:3000/" 

      const response = await fetch(`${API_BASE_URL}api/v1/public/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      })

      const data: LoginResponse = await response.json()
      console.log(data)

      if (response.ok) {
        Alert.alert("Sucesso", "Login realizado com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              
              router.replace("/app-map-view")
            },
          },
        ])
      } else {
        Alert.alert("Erro", data.message || "Credenciais inválidas")
      }
    } catch (error) {
      console.error("Login error:", error)
      Alert.alert("Erro", "Erro de conexão. Verifique sua internet.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = () => {
    Alert.alert("Em breve", "Funcionalidade de criar conta será implementada em breve")
  }

  const handleBackToProfile = () => {
    router.replace("/(tabs)/app-map-view")
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 56 : 40, // espaço superior confortável
  },

  // Card que envolve o formulário (opcional — torne a tela mais "clean")
  formCard: {
    marginHorizontal: 12,
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : "#ffffff",
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    // sombra iOS
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    // elevação Android
    elevation: 6,
  },

  title: {
    fontSize: 30,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 20,
    textAlign: "left",
  },

  inputLabel: {
    fontSize: 13,
    color: colors.text + "B0" || "#6b7280", // tom mais neutro
    marginBottom: 8,
    fontWeight: "500",
  },

  input: {
    height: 50,
    fontSize: 16,
    color: colors.text,
    backgroundColor: Platform.OS === "ios" ? "rgba(250,250,250,0.9)" : "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    // sombra discreta interna (visual)
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 28,
  },

  // Botão principal (Entrar) — preenchido, cor de destaque (tint)
  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.tint, // cor principal do tema
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    // sombra para destaque
    shadowColor: colors.tint,
    shadowOpacity: Platform.OS === "ios" ? 0.18 : 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Botão secundário (Criar conta) — contorno elegante
  createAccountButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  createAccountButtonText: {
    color: colors.tint,
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "none",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginLeft: 8,
  },

  // botão de voltar (top-left) com fundo sutil para legibilidade
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 18,
    left: 12,
    zIndex: 20,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  // contêiner dos campos, caso você queira centralizar/espaciar
  fieldsWrapper: {
    marginTop: 6,
  },

  // caso use textos de ajuda/erro
  helperText: {
    fontSize: 12,
    color: "#ef4444", // vermelho suave para erros
    marginTop: 6,
  },

  // espaçador final para evitar sobreposição com tab bar
  bottomSpacer: {
    height: Platform.OS === "ios" ? 90 : 80,
  },
});


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Botão voltar para Profile (canto superior esquerdo) */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackToProfile} accessibilityLabel="Voltar para profile">
        <Ionicons name="arrow-back" size={26} color={colors.text} />
      </TouchableOpacity>

      <View>
        <Text style={styles.title}>Entrar</Text>

        <Text style={styles.inputLabel}>E-mail:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder=""
          placeholderTextColor={colors.text + "80"}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.inputLabel}>Senha:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder=""
          placeholderTextColor={colors.text + "80"}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <View style={styles.separator} />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.text} />
              <Text style={styles.loadingText}>Entrando...</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount} disabled={loading}>
          <Text style={styles.createAccountButtonText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
