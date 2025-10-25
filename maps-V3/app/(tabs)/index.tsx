import AppMapView from '@/components/app-map-view';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";

export default function HomeScreen() {

  const params = useLocalSearchParams<{ search?: string }>(); //hook para ler os parâmetros da rota

  useEffect(() => { //efeito que corre sempre que o parâmetro de busca mudar
    if (params.search) { //verifica se o parâmetro de busca foi recebido
      const plusCode = params.search;

      Alert.alert( //ação de feedback, substituir com lógica de mapa
        "Localizar Propriedade",
        `A exibir a localização para: ${plusCode}`
      );

      //TODO: adiconar a lógica de mapa aqui, ex: mapRef.current.animateTo(plusCode)
    }
  }, [params.search]); //a dependência do efeito é o parâmetro de busca

    return (
      <View style={{ flex: 1 }}>                
          <AppMapView />                
            <View style={styles.headerWrapper}>

                  {/* Container da busca */}
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#888" style={{ marginRight: 6}}/>
                    <TextInput
                      placeholder="Buscar"
                      placeholderTextColor="#888"
                      style={styles.searchInput}
                    />
                  </View>                  
                </View>
            </View>        
    );
}

const styles = StyleSheet.create({
  headerWrapper: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  }, 
});