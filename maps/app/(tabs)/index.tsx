// app/index.tsx
import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token"); // ou outra chave
      if (token) {
        // já autenticado -> vai para as Tabs
        router.replace("/(tabs)");
      } else {
        // não autenticado -> vai para o login
        router.replace("/(auth)/login");
      }
    };
    checkAuth();
  }, []);
  return null; // não precisa renderizar nada
}
