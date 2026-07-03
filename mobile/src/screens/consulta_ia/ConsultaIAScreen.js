import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

const NIVEL_INFO = {
  facil: { cor: '#16A34A', bg: '#F0FDF4', label: 'Fácil' },
  medio: { cor: '#EA580C', bg: '#FFF7ED', label: 'Médio' },
  dificil: { cor: '#DC2626', bg: '#FEF2F2', label: 'Difícil' },
};

export default function ConsultaIAScreen({ navigation }) {
  const [simulacoes, setSimulacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      buscarSimulacoes();
    }, [])
  );

  async function buscarSimulacoes() {
    try {
      setCarregando(true);
      const response = await api.get('/api/consulta-ia/');
      setSimulacoes(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as simulações.');
    } finally {
      setCarregando(false);
    }
  }

  function renderSimulacao({ item }) {
    const nivel = NIVEL_INFO[item.nivel] || NIVEL_INFO.facil;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('SimulacaoChat', { id: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardHeader}>
            <View style={[styles.nivelTag, { backgroundColor: nivel.bg }]}>
              <Text style={[styles.nivelTexto, { color: nivel.cor }]}>
                {nivel.label}
              </Text>
            </View>
            {!item.ativa && (
              <View style={styles.finalizadoTag}>
                <Text style={styles.finalizadoTexto}>Finalizada</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitulo}>
            {item.titulo || `Simulação #${item.id}`}
          </Text>
          <Text style={styles.cardSub}>
            {item.total_mensagens} mensagens · {new Date(item.criado_em).toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <Text style={styles.seta}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Simulação IA</Text>
        <TouchableOpacity
          style={styles.novoBotao}
          onPress={() => navigation.navigate('NovaSimulacao')}
        >
          <Text style={styles.novoBotaoTexto}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcone}>🤖</Text>
        <Text style={styles.infoTexto}>
          Simule consultas com um paciente virtual para treinar seu raciocínio clínico em 3 níveis de dificuldade.
        </Text>
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={simulacoes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderSimulacao}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioIcone}>💬</Text>
              <Text style={styles.vazioTitulo}>Nenhuma simulação ainda</Text>
              <Text style={styles.vazioSub}>Toque em "+ Nova" para começar</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  headerTitulo: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  novoBotao: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  novoBotaoTexto: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 10,
  },
  infoIcone: { fontSize: 24 },
  infoTexto: { flex: 1, fontSize: 13, color: '#0369A1', lineHeight: 18 },
  listaContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 10,
  },
  cardLeft: { flex: 1 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  nivelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  nivelTexto: { fontSize: 11, fontWeight: '600' },
  finalizadoTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  finalizadoTexto: { fontSize: 11, color: '#9CA3AF' },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#9CA3AF' },
  seta: { fontSize: 22, color: '#D1D5DB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vazioContainer: { alignItems: 'center', paddingTop: 60 },
  vazioIcone: { fontSize: 48, marginBottom: 12 },
  vazioTitulo: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  vazioSub: { fontSize: 14, color: '#9CA3AF' },
});