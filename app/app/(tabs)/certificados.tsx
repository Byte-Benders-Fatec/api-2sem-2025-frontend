import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator, // indicador de carregamento
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// dados fictícios (MOCK_DATA)
// dados a virem da base de dados ou API
interface Property {
    id: string;
    name: string;
    address: string;
    registrationNumber: string; //número de matrícula ou registro
}

const MOCK_PROPERTIES: Property[] = [
    { id: '1', name: 'Sítio Recando Verde', address: 'Rua das Flores, 123, Zona rural', registrationNumber: 'CAR-12345' },
    { id: '2', name: 'Fazenda Água Clara', address: 'Rodovia BR-101, Km 50', registrationNumber: 'CAR-67890' },
    { id: '3', name: 'Chácara do Sol', address: 'Estrada da colina, 789', registrationNumber: 'CAR-11223' },
];

// componente reutilizável para o cartão de propriedade
type PropertyCardProps = {
    property: Property;
    onGenerate: () => void;
    isLoading: boolean;
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onGenerate, isLoading }) => {
    return (
        <View style={styles.card}>
            <Ionicons name = "business-outline" size={40} color="#007BFF" style={styles.cardIcon} />
            <View style = {styles.cardInfo}>
                <Text style={styles.cardTitle}>{property.name}</Text>
                <Text style={styles.cardAddress}>{property.address}</Text>
                <Text style={styles.cardRegistration}>Matrícula: {property.registrationNumber}</Text>
            </View>
            <TouchableOpacity
                style={[styles.button, isLoading ? styles.buttonDisabled : null]}
                onPress={onGenerate}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                    <Ionicons name="download-outline" size={20} color="white" />
                    <Text style={styles.buttonText}>Gerar Certificado</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

// componente principal da página
export default function CertificadosScreen() {
    //estado para controlar qual propriedadeestá a gerar o PDF
    const [loadingProperty, setLoadingProperty] = useState<string | null>(null);

    //função para simular a geração do certificado
    const handGeneratorPDF = (property: Property) => {
        setLoadingProperty(property.id);

        Alert.alert(
            'A gerar certificado...',
            `Aguarde um momento enquanto preparamos o documento para "${property.name}".`
        );

        // simula uma chamada de API ou processo de geração
        setTimeout(() => {
            setLoadingProperty(null);
            Alert.alert(
                'Certificado Pronto!',
                `O certificado para "${property.name}" foi gerado.\n\n(Aqui, a app iria abrir ou partilhar o PDF)`
            );
            //
            // TODO:substituir esta simulação pela lógica real de geração de PDF com a biblioteca 'expo-print'
            //
        }, 3000); // simula um atraso de 3 segundos
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Emissão de certificados</Text>
                <Text style={styles.description}>
                    Selecione uma propriedade para gerar o certificado digital em formato PDF.
                </Text>

                <View style={styles.listContainer}>
                    {MOCK_PROPERTIES.map((prop) => (
                        <PropertyCard
                            key={prop.id}
                            property={prop}
                            onGenerate={() => handGeneratorPDF(prop)}
                            isLoading={loadingProperty === prop.id}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// estilos da página
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  container: {
    padding: 20,
    paddingBottom: 120, // Espaço extra no final para a TabBar flutuante não tapar o conteúdo
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  listContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardIcon: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  cardInfo: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardAddress: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardRegistration: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#a0cfff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
