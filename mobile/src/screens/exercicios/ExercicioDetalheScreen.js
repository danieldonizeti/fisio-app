import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../../services/api';

export default function ExercicioDetalheScreen({ route, navigation }) {
  const { id, nome, exercicio: exercicioInicial } = route.params;
  const [exercicio, setExercicio] = useState(exercicioInicial || null);
  const [carregando, setCarregando] = useState(!exercicioInicial);

  useEffect(() => {
    navigation.setOptions({ title: nome });
    buscarExercicio();
  }, []);

  async function buscarExercicio() {
    try {
      const response = await api.get(`/api/exercicios/${id}/`);
      setExercicio(response.data);
    } catch (error) {
      console.warn('Erro ao carregar exercicio', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
      });
      if (!exercicioInicial) {
        Alert.alert('Erro', 'Nao foi possivel carregar o exercicio.');
      }
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA580C" />
      </View>
    );
  }

  if (!exercicio) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.categoriaTag}>
          <Text style={styles.categoriaTexto}>{exercicio.categoria_display}</Text>
        </View>


        <View style={styles.prescricaoContainer}>
          <View style={styles.prescricaoCard}>
            <Text style={styles.prescricaoValor}>{exercicio.series}</Text>
            <Text style={styles.prescricaoLabel}>Series</Text>
          </View>
          <View style={styles.prescricaoDivider} />
          <View style={styles.prescricaoCard}>
            <Text style={styles.prescricaoValor}>{exercicio.repeticoes}</Text>
            <Text style={styles.prescricaoLabel}>Repeticoes</Text>
          </View>
        </View>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>📋 O que é</Text>
        <Text style={styles.secaoTexto}>{exercicio.descricao}</Text>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>👐 Como realizar</Text>
        <Text style={styles.secaoTexto}>{exercicio.como_realizar}</Text>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Detalhes</Text>
        <View style={styles.detalheLinha}>
          <Text style={styles.detalheLabel}>Nivel</Text>
          <Text style={styles.detalheValor}>{exercicio.nivel_display}</Text>
        </View>
        <View style={styles.detalheLinha}>
          <Text style={styles.detalheLabel}>Categoria</Text>
          <Text style={styles.detalheValor}>{exercicio.categoria_display}</Text>
        </View>
        <View style={styles.detalheLinha}>
          <Text style={styles.detalheLabel}>Musculo alvo</Text>
          <Text style={styles.detalheValor}>{exercicio.musculo_alvo}</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoriaTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoriaTexto: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '600',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  prescricaoContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prescricaoCard: {
    flex: 1,
    alignItems: 'center',
  },
  prescricaoValor: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  prescricaoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  prescricaoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  secao: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  secaoTexto: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  detalheLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detalheLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  detalheValor: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
});
