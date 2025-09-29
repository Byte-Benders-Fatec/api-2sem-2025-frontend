import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function CadastroScreen() {
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleCadastro = () => {

    console.log("Nome:", nome);
    console.log("CPF:", cpf);
    console.log("Email:", email);
    console.log("Senha:", senha);
    console.log("Confirmar Senha:", confirmarSenha);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar</Text>

      <Text style={styles.label}>Nome:</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={setNome}
        placeholder="Digite seu nome"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>CPF:</Text>
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={setCpf}
        placeholder="Digite seu CPF"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        maxLength={11} 
      />

      <Text style={styles.label}>E-mail:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Digite seu e-mail"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha:</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        placeholder="Digite sua senha"
        placeholderTextColor="#aaa"
        secureTextEntry
      />

      <Text style={styles.label}>Confirmar Senha:</Text>
      <TextInput
        style={styles.input}
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholder="Confirme sua senha"
        placeholderTextColor="#aaa"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleCadastro}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    color: "#fff",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    padding: 10,
    color: "#fff",
    borderRadius: 5,
  },
  button: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#fff",
    padding: 12,
    alignItems: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
