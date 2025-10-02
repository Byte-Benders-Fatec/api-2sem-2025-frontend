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
import AppMapView from '@/app/app-map-view'
import React from "react"

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
      Alert.alert("Erro", "Por favor, preencha todos os campos")
      return
    }

    setLoading(true)

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 40,
      justifyContent: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "300",
      color: colors.text,
      marginBottom: 60,
      textAlign: "left",
    },
    inputLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontWeight: "400",
    },
    input: {
      borderWidth: 1,
      borderColor: colors.text,
      backgroundColor: "transparent",
      color: colors.text,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 32,
      borderRadius: 0,
    },
    separator: {
      height: 1,
      backgroundColor: colors.text,
      marginVertical: 40,
    },
    loginButton: {
      borderWidth: 1,
      borderColor: colors.text,
      backgroundColor: "transparent",
      paddingVertical: 16,
      paddingHorizontal: 24,
      marginBottom: 20,
      alignItems: "center",
    },
    loginButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "400",
    },
    createAccountButton: {
      backgroundColor: "transparent",
      paddingVertical: 16,
      paddingHorizontal: 24,
      alignItems: "center",
    },
    createAccountButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "400",
      textDecorationLine: "underline",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: colors.text,
      fontSize: 16,
      marginLeft: 8,
    },
  })

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
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