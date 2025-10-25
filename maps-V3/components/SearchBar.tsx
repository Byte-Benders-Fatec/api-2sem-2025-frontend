import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar({ placeholder = "Buscar..." }) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6 }} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#888"
        style={styles.searchInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 10,
    margin: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
});
