import React from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import AppMapView from '@/components/app-map-view';

export default function HomeScreen() {
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
