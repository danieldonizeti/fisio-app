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
import FotoCard from '../../components/FotoCard';

const NIVEL_CORES = {
  iniciante: { bg: '#F0FDF4', texto: '#16A34A' },
  intermediario: { bg: '#FFF7ED', texto: '#EA580C' },
  avancado: { bg: '#FEF2F2', texto: '#DC2626' },
};

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
      if (!exercicioInicial) {
        Alert.alert('Erro', 'Não foi possível carregar o exercício.');
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

  const nivelCor = NIVEL_CORES[exercicio.nivel] || NIVEL_CORES.iniciante;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header com foto */}
      <View style={styles.header}>
        <FotoCard
          foto={exercicio.foto}
          altura={220}
          placeholder="🏃"
          cor="#FFF7ED"
        />
        <View style={styles.headerInfo}>
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: nivelCor.bg }]}>
              <Text style={[styles.tagTexto, { color: nivelCor.texto }]}>
                {exercicio.nivel_display}
              </Text>
            </View>
            <View style={styles.tagCategoria}>
              <Text style={styles.tagCategoriaTexto}>{exercicio.categoria_display}</Text>
            </View>
          </View>
          <Text style={styles.titulo}>{exercicio.nome}</Text>
          <Text style={styles.musculo}>💪 {exercicio.musculo_alvo}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{exercicio.series}</Text>
              <Text style={styles.statLabel}>Séries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{exercicio.repeticoes}</Text>
              <Text style={styles.statLabel}>Repetições</Text>
            </View>
          </View>
        </View>
      </View>

      {/* O que é */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>📋 O que é</Text>
        <Text style={styles.secaoTexto}>{exercicio.descricao}</Text>
      </View>

      {/* Como realizar */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>👐 Como realizar</Text>
        <Text style={styles.secaoTexto}>{exercicio.como_realizar}</Text>
      </View>

      {/* Detalhes */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>📊 Detalhes</Text>
        <View style={styles.detalheLinha}>
          <Text style={styles.detalheLabel}>Nível</Text>
          <Text style={styles.detalheValor}>{exercicio.nivel_display}</Text>
        </View>
        <View style={styles.detalheLinha}>
          <Text style={styles.detalheLabel}>Categoria</Text>
          <Text style={styles.detalheValor}>{exercicio.categoria_display}</Text>
        </View>
        <View style={styles.detalheLinha}>
          <Text style={styles.detalheLabel}>Músculo alvo</Text>
          <Text style={styles.detalheValor}>{exercicio.musculo_alvo}</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagTexto: { fontSize: 11, fontWeight: '600' },
  tagCategoria: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagCategoriaTexto: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  musculo: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCard: { flex: 1, alignItems: 'center' },
  statValor: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  secao: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  secaoTexto: { fontSize: 14, color: '#374151', lineHeight: 22 },
  detalheLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detalheLabel: { fontSize: 14, color: '#6B7280' },
  detalheValor: { fontSize: 14, fontWeight: '500', color: '#111827' },
});