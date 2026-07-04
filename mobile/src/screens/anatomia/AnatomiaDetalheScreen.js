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

export default function AnatomiaDetalheScreen({ route, navigation }) {
  const { id, nome, endpoint, item: itemInicial } = route.params;
  const [item, setItem] = useState(itemInicial || null);
  const [carregando, setCarregando] = useState(!itemInicial);

  useEffect(() => {
    navigation.setOptions({ title: nome });
    buscarItem();
  }, []);

  async function buscarItem() {
    try {
      const response = await api.get(`/api/anatomia/${endpoint}/${id}/`);
      setItem(response.data);
    } catch (error) {
      console.warn('Erro ao carregar anatomia', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
      });
      if (!itemInicial) {
        Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
      }
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  if (!item) return null;

  // Campos específicos por tipo de estrutura
  const camposEspecificos = {
    musculos: [
      { titulo: '📍 Origem', valor: item.origem },
      { titulo: '📌 Inserção', valor: item.insercao },
      { titulo: '⚡ Função', valor: item.funcao },
      { titulo: '🧠 Inervação', valor: item.inervacao },
    ],
    tendoes: [
      { titulo: '💪 Músculo Associado', valor: item.musculo_associado },
      { titulo: '🦴 Osso Associado', valor: item.osso_associado },
      { titulo: '⚡ Função', valor: item.funcao },
    ],
    ligamentos: [
      { titulo: '🔄 Articulação', valor: item.articulacao },
      { titulo: '⚡ Função', valor: item.funcao },
      { titulo: '⚠️ Lesão Comum', valor: item.lesao_comum },
    ],
    ossos: [
      { titulo: '📐 Tipo', valor: item.tipo_display },
      { titulo: '⚡ Função', valor: item.funcao },
      { titulo: '🔄 Articulações Envolvidas', valor: item.articulacoes_envolvidas },
    ],
    articulacoes: [
      { titulo: '📐 Tipo', valor: item.tipo_display },
      { titulo: '🦴 Ossos Envolvidos', valor: item.ossos_envolvidos },
      { titulo: '🔄 Movimentos Possíveis', valor: item.movimentos_possiveis },
      { titulo: '⚡ Estruturas Estabilizadoras', valor: item.estruturas_estabilizadoras },
    ],
  };

  const campos = camposEspecificos[endpoint] || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.regiaoTag}>
          <Text style={styles.regiaoTexto}>{item.regiao_display}</Text>
        </View>
        <Text style={styles.titulo}>{item.nome}</Text>
        {item.nome_cientifico ? (
          <Text style={styles.nomeCientifico}>{item.nome_cientifico}</Text>
        ) : null}
      </View>

      {/* Descrição */}
      {item.descricao ? (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>📋 Descrição</Text>
          <Text style={styles.secaoTexto}>{item.descricao}</Text>
        </View>
      ) : null}

      {/* Campos específicos */}
      {campos.map((campo) => campo.valor ? (
        <View key={campo.titulo} style={styles.secao}>
          <Text style={styles.secaoTitulo}>{campo.titulo}</Text>
          <Text style={styles.secaoTexto}>{campo.valor}</Text>
        </View>
      ) : null)}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  regiaoTag: {
    backgroundColor: '#FDF4FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  regiaoTexto: { fontSize: 12, color: '#9333EA', fontWeight: '600' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  nomeCientifico: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  secao: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  secaoTexto: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
