import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMyProperties,
  searchPropertiesByCPF,
  deleteProperty,
  getPropertyMongoDetails,
  UserProperty
} from '@/services/userProperties';
import { loadProfile } from '@/lib/session';

interface PropertyDisplay {
  id: number;
  name: string;
  plusCode: string;
  type: 'Rural' | 'Urbano';
  area: string;
  registryNumber: string;
}

type PropertyCardProps = {
  property: PropertyDisplay;
  onViewOnMap: () => void;
  onCreatePlusCode: () => void;
  onDelete: () => void;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onViewOnMap, onCreatePlusCode, onDelete }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons
          name={property.type === 'Rural' ? 'leaf-outline' : 'business-outline'}
          size={24}
          color={property.type === 'Rural' ? '#28a745' : '#007bff'}
        />
        <Text style={styles.cardTitle}>{property.name}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Matrícula:</Text> {property.registryNumber}
        </Text>
        {!!property.plusCode && (
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Plus Code:</Text> {property.plusCode}
          </Text>
        )}
        <Text style={styles.infoText}>
          <Text style={styles.infoLabel}>Área:</Text> {property.area}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onViewOnMap}>
          <Ionicons name="map-outline" size={20} color="#007BFF" />
          <Text style={styles.actionButtonText}>Ver no Mapa</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onCreatePlusCode}>
          <Ionicons name="add-circle-outline" size={20} color="#28a745" />
          <Text style={[styles.actionButtonText, { color: '#28a745' }]}>Criar Plus Code</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function PropriedadesScreen() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const convertToDisplay = (prop: UserProperty): PropertyDisplay => ({
    id: prop.id,
    name: prop.display_name || 'Propriedade sem nome',
    plusCode: '',
    type: 'Rural',
    area: '',
    registryNumber: prop.registry_number || 'N/A',
  });

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [])
  );

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      const userProperties = await getMyProperties();
      const displayProperties = userProperties.map(convertToDisplay);
      setProperties(displayProperties);
    } catch (error: any) {
      console.error('Erro ao carregar propriedades:', error);
      Alert.alert('Erro', 'Não foi possível carregar as propriedades.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByCPF = async () => {
    try {
      const profile = await loadProfile();
      if (!profile?.cpf) {
        Alert.alert('CPF não encontrado', 'Não foi possível encontrar o CPF do usuário. Faça login novamente.');
        return;
      }

      Alert.alert(
        'Buscar Propriedades',
        `Deseja buscar propriedades cadastradas no CPF ${profile.cpf}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Buscar',
            onPress: async () => {
              try {
                setIsSearching(true);
                const response = await searchPropertiesByCPF(profile.cpf!);
                if (response.total === 0) {
                  Alert.alert('Nenhuma Propriedade Encontrada', 'Não foram encontradas propriedades cadastradas em seu CPF.');
                } else {
                  Alert.alert('Sucesso!', `${response.total} propriedade(s) encontrada(s) e salva(s).`);
                  await loadProperties();
                }
              } catch (error: any) {
                console.error('Erro ao buscar por CPF:', error);
                Alert.alert('Erro', error.message || 'Não foi possível buscar as propriedades.');
              } finally {
                setIsSearching(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário. Faça login novamente.');
    }
  };

  function polygonCentroid(coords: number[][][]): { lat: number; lng: number } | null {
    if (!Array.isArray(coords) || !Array.isArray(coords[0]) || coords[0].length < 3) return null;
    const ring = coords[0];
    let area = 0, cx = 0, cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x0, y0] = ring[j];
      const [x1, y1] = ring[i];
      const f = x0 * y1 - x1 * y0;
      area += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
    area *= 0.5;
    if (Math.abs(area) < 1e-12) {
      const sum = ring.reduce((acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
      return { lat: sum.y / ring.length, lng: sum.x / ring.length };
    }
    cx /= (6 * area); cy /= (6 * area);
    return { lat: cy, lng: cx };
  }

  const handleNavigateToMap = async (propertyId: number) => {
    try {
      const propertyDetails = await getPropertyMongoDetails(propertyId);

      const plusGlobal = propertyDetails?.mongo_details?.properties?.plus_code?.global_code as string | undefined;
      if (plusGlobal && plusGlobal.trim().length > 0) {
        router.push({ pathname: '/(tabs)/mapa', params: { search: plusGlobal, ts: String(Date.now()) } });
        return;
      }

      const coords = propertyDetails?.mongo_details?.geometry?.coordinates as number[][][] | undefined;
      const centroid = coords ? polygonCentroid(coords) : null;

      if (centroid) {
        router.push({
          pathname: '/(tabs)/mapa',
          params: {
            lat: String(centroid.lat),
            lng: String(centroid.lng),
            description: propertyDetails?.mongo_details?.properties?.cod_imovel ?? 'Propriedade',
            ts: String(Date.now())
          }
        });
        return;
      }

      Alert.alert('Aviso', 'Não foi possível localizar esta propriedade no mapa.');
    } catch (error) {
      console.error('Erro ao buscar detalhes da propriedade:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização da propriedade.');
    }
  };

  const handleCreatePlusCode = (propertyId: number) => {
    // vai para o mapa em modo de seleção
    router.push({
      pathname: '/(tabs)/mapa',
      params: {
        mode: 'createPlusCode',
        propertyId: String(propertyId),
        ts: String(Date.now())
      }
    });
  };

  const handleDeleteProperty = (propertyId: number, propertyName: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja remover "${propertyName}" da sua lista? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              setProperties(prev => prev.filter(p => p.id !== propertyId));
              Alert.alert('Sucesso', 'Propriedade removida com sucesso.');
            } catch (error) {
              console.error('Erro ao excluir propriedade:', error);
              Alert.alert('Erro', 'Não foi possível excluir a propriedade.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Minhas Propriedades</Text>
        <Text style={styles.description}>
          Aqui estão todas as suas propriedades cadastradas.
          {properties.length === 0 && ' Busque propriedades em seu CPF para começar.'}
        </Text>

        {properties.length === 0 && (
          <TouchableOpacity
            style={[styles.mainButton, styles.searchButton]}
            onPress={handleSearchByCPF}
            disabled={isSearching || isLoading}
          >
            {isSearching ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="search-outline" size={24} color="white" />
                <Text style={styles.mainButtonText}>Buscar Propriedades em Meu CPF</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cadastrar Nova Propriedade: desabilitado por enquanto */}

        {/* <TouchableOpacity style={styles.mainButton} onPress={() => router.push('/')}>
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.mainButtonText}>Cadastrar Nova Propriedade no Mapa</Text>
        </TouchableOpacity> */}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Carregando propriedades...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {properties.length > 0 ? (
              properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  onViewOnMap={() => handleNavigateToMap(prop.id)}
                  onCreatePlusCode={() => handleCreatePlusCode(prop.id)}
                  onDelete={() => handleDeleteProperty(prop.id, prop.name)}
                />
              ))
            ) : (
              <Text style={styles.emptyListText}>Nenhuma propriedade cadastrada.</Text>
            )}
          </View>
        )}

        {properties.length > 0 && (
          <TouchableOpacity
            style={[styles.secondaryButton]}
            onPress={handleSearchByCPF}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#007BFF" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#007BFF" />
                <Text style={styles.secondaryButtonText}>Atualizar Lista (Buscar Novamente)</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  container: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  description: { fontSize: 16, color: '#666', marginBottom: 20 },
  mainButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#28a745', paddingVertical: 15, borderRadius: 10, marginBottom: 15,
  },
  searchButton: { backgroundColor: '#007BFF' },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  secondaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', paddingVertical: 12, borderRadius: 10, marginTop: 15,
    borderWidth: 2, borderColor: '#007BFF',
  },
  secondaryButtonText: { color: '#007BFF', fontSize: 15, fontWeight: '600', marginLeft: 8 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  listContainer: { width: '100%' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
    borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10, flex: 1 },
  cardBody: { marginBottom: 10 },
  infoLabel: { fontWeight: 'bold', color: '#555' },
  infoText: { fontSize: 16, color: '#666', marginBottom: 5 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionButtonText: { fontSize: 16, marginLeft: 5, color: '#007BFF' },
  emptyListText: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 40 },
});
