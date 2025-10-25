import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// estrutura de dados e dados fictícios (MOCK_DATA)
interface Property {
    id: string;
    name: string;
    plusCode: string;
    type: 'Rural' | 'Urbano'; //tipo de propriedade
    area: string; // ex: "10 ha" ou "500 m²"
}

// dados a virem da base de dados
const MOCK_PROPERTIES: Property[] = [
    { id: '1', name: 'Fazenda Boa Vista', plusCode: '579V+CQ, São Paulo', type: 'Rural', area: '15 ha' },
    { id: '2', name: 'Chácara Recanto Feliz', plusCode: '8G3J+W2, São Paulo', type: 'Rural', area: '1200 m²' },
    { id: '3', name: 'Sítio Verdejante', plusCode: '7H2K+V1, Rio de Janeiro', type: 'Rural', area: '120 ha' }
];

// componente de cartão de propriedade
type PropertyCardProps = {
    property: Property;
    onViewOnMap: () => void;
    onDelete: () => void;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onViewOnMap, onDelete }) => {
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
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Plus Code:</Text> {property.plusCode}</Text>
                <Text style={styles.infoText}><Text style={styles.infoLabel}>Área:</Text> {property.area}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={onViewOnMap}>
                    <Ionicons name="map-outline" size={20} color="#007BFF" />
                    <Text style={styles.actionButtonText}>Ver no Mapa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// componente principal da página
export default function PropriedadesScreen() {
    const router = useRouter();
    const [properties, setProperties] = useState(MOCK_PROPERTIES);

    const handleNavigatetoMap = (plusCode: string) => {
        // navega para a tela do mapa e passa o plusCode como parâmetro de busca
        router.push({ pathname: '/', params: { search: plusCode } });
    };

    const handleDeleteProperty = (propertyId: string) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir esta propriedade? Esta ação não pode ser desfeita.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir", 
                    style: "destructive", 
                    onPress: () => {
                        //lógica para remover a propriedade da lista (e da base de dados)
                        setProperties(prev => prev.filter(p => p.id !== propertyId));
                        //TODO: adicionar lógica para remover da base de dados
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Minhas Propriedades</Text>
                <Text style={styles.description}>
                    Aqui estão todas as suas propriedades cadastradas. Cadastre novas áreas através do mapa.
                </Text>

                <TouchableOpacity
                    style={styles.mainButton}
                    onPress={() => router.push('/')} //leva o utilizador para o mapa para cadastrar
                >
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <Text style={styles.mainButtonText}>Cadastrar Nova Propriedade no Mapa</Text>
                </TouchableOpacity>

                <View style={styles.listContainer}>
                    {properties.length > 0 ?(
                        properties.map((prop) => (
                            <PropertyCard
                                key={prop.id}
                                property={prop}
                                onViewOnMap={() => handleNavigatetoMap(prop.plusCode)}
                                onDelete={() => handleDeleteProperty(prop.id)}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyListText}>Nenhuma propriedade cadastrada.</Text>
                        )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// estilos
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f8' },
  container: { padding: 20, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  description: { fontSize: 16, color: '#666', marginBottom: 20 },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  listContainer: { width: '100%' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  cardBody: { marginBottom: 10 },
  infoLabel: { fontWeight: 'bold', color: '#555' },
  infoText: { fontSize: 16, color: '#666', marginBottom: 5 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionButtonText: { fontSize: 16, marginLeft: 5, color: '#007BFF' },
  emptyListText: { textAlign: 'center', fontSize: 16, color: '#888', marginTop: 40 },
});