import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Linking
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { getJson, deleteJson } from "@/lib/api";

interface Certificate {
  id: string;
  number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  property_name: string;
  registry_number: string;
  municipio?: string;
  cod_estado?: string;
  document_id: string;
}

// componente reutilizável para o cartão de certificado
type CertificateCardProps = {
  certificate: Certificate;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate, onView, onDownload, onDelete, isDeleting }) => {
  const formattedDate = new Date(certificate.issue_date).toLocaleDateString('pt-BR');

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="ribbon-outline" size={32} color="#007BFF" />
        <View style={styles.headerText}>
          <Text style={styles.cardTitle}>{certificate.property_name}</Text>
          <Text style={styles.cardSubtitle}>
            {certificate.municipio ? `${certificate.municipio} - ` : ''}{certificate.cod_estado || ''}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.infoText}>Matrícula: <Text style={styles.bold}>{certificate.registry_number}</Text></Text>
        <Text style={styles.infoText}>Emitido em: <Text style={styles.bold}>{formattedDate}</Text></Text>
        <Text style={styles.infoText}>Número: <Text style={styles.bold}>{certificate.number}</Text></Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={onView}
        >
          <Ionicons name="eye-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Ver</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.downloadButton]}
          onPress={onDownload}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Baixar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, isDeleting && styles.disabledButton]}
          onPress={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CertificadosScreen() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      const data = await getJson<Certificate[]>('/certificate/list');
      setCertificates(data);
    } catch (error) {
      console.error("Erro ao buscar certificados:", error);
      Alert.alert("Erro", "Não foi possível carregar os certificados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCertificates();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificates();
  };

  const handleView = async (cert: Certificate) => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
      const pdfUrl = `${baseUrl}/documents/${cert.document_id}/view`;
      await Linking.openURL(pdfUrl);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir o certificado.");
    }
  };

  const handleDownload = async (cert: Certificate) => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
      const pdfUrl = `${baseUrl}/documents/${cert.document_id}/download`;
      await Linking.openURL(pdfUrl);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível baixar o certificado.");
    }
  };

  const handleDelete = (cert: Certificate) => {
    Alert.alert(
      "Excluir Certificado",
      `Tem certeza que deseja excluir o certificado de "${cert.property_name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeletingId(cert.id);
            try {
              await deleteJson(`/certificate/${cert.id}`);
              setCertificates(prev => prev.filter(c => c.id !== cert.id));
              Alert.alert("Sucesso", "Certificado excluído com sucesso.");
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o certificado.");
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Meus Certificados</Text>
        <Text style={styles.description}>
          Gerencie seus certificados de propriedade emitidos pelo Rural CAR.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.listContainer}>
            {certificates.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum certificado encontrado.</Text>
            ) : (
              certificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  certificate={cert}
                  onView={() => handleView(cert)}
                  onDownload={() => handleDownload(cert)}
                  onDelete={() => handleDelete(cert)}
                  isDeleting={deletingId === cert.id}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f8',
  },
  container: {
    padding: 20,
    paddingBottom: 120,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardInfo: {
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#28a745',
  },
  downloadButton: {
    backgroundColor: '#007BFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    maxWidth: 50,
    flex: 0.5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
