// app/(auth)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      // propriedades compatíveis com Native Stack / expo-router
      screenOptions={{
        headerShown: false, // esconde o header por completo
        headerTitle: "",    // garante que não haja título vazio/placeholder
      }}
    />
  );
}
