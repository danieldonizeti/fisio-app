import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../../services/api';

const REGIOES = [
  { label: 'Todas', value: '' },
  { label: 'Cabeca e Pescoco', value: 'cabeca_pescoco' },
  { label: 'Ombro', value: 'ombro' },
  { label: 'Braco', value: 'braco' },
  { label: 'Cotovelo', value: 'cotovelo' },
  { label: 'Antebraco', value: 'antebraco' },
  { label: 'Punho e Mao', value: 'punho_mao' },
  { label: 'Coluna Cervical', value: 'coluna_cervical' },
  { label: 'Coluna Toracica', value: 'coluna_toracica' },
  { label: 'Coluna Lombar', value: 'coluna_lombar' },
  { label: 'Quadril', value: 'quadril' },
  { label: 'Coxa', value: 'coxa' },
  { label: 'Joelho', value: 'joelho' },
  { label: 'Perna', value: 'perna' },
  { label: 'Tornozelo e Pe', value: 'tornozelo_pe' },
];

function extrairLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function AnatomiaListaScreen({ route, navigation }) {
  const { titulo, endpoint } = route.params;
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [regiaoFiltro, setRegiaoFiltro] = useState('');

  useEffect(() => {
    navigation.setOptions({ title: titulo });
    buscarItens();
  }, [busca, regiaoFiltro]);

  async function buscarItens() {
    try {
      setCarregando(true);
      const params = {};
      if (busca) params.search = busca;

      const response = await api.get(`/api/anatomia/${endpoint}/`, { params });
      const lista = extrairLista(response.data);
      const dados = regiaoFiltro
        ? lista.filter((item) => item.regiao === regiaoFiltro)
        : lista;

      setItens(dados);
    } catch (error) {
      Alert.alert('Erro', `Não foi possível carregar ${titulo.toLowerCase()}.`);
    } finally {
      setCarregando(false);
    }
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AnatomiaDetalhe', {
          id: item.id,
          nome: item.nome,
          endpoint,
          item,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.regiaoTag}>
            <Text style={styles.regiaoTexto}>{item.regiao_display}</Text>
          </View>
          <Text style={styles.cardNome}>{item.nome}</Text>
          {item.nome_cientifico ? (
            <Text style={styles.cardCientifico}>{item.nome_cientifico}</Text>
          ) : null}
          {item.descricao ? (
            <Text style={styles.cardDescricao} numberOfLines={2}>
              {item.descricao}
            </Text>
          ) : null}
        </View>
        <Text style={styles.seta}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buscaContainer}>
        <TextInput
          style={styles.buscaInput}
          placeholder={`🔍 Buscar ${titulo.toLowerCase()}...`}
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <FlatList
        horizontal
        data={REGIOES}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosLista}
        contentContainerStyle={styles.filtrosContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filtroPill,
              regiaoFiltro === item.value && styles.filtroPillAtivo,
            ]}
            onPress={() => setRegiaoFiltro(item.value)}
          >
            <Text style={[
              styles.filtroTexto,
              regiaoFiltro === item.value && styles.filtroTextoAtivo,
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingTexto}>Carregando {titulo.toLowerCase()}...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={itens}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioTexto}>Nenhum item encontrado.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  buscaContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  buscaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtrosContainer: {
    paddingHorizontal: 16,
    paddingBottom: 5,
    gap: 8,
  },
  filtrosLista: {
    flexGrow: 0,
  },
  filtroPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtroPillAtivo: { backgroundColor: '#9333EA', borderColor: '#9333EA' },
  filtroTexto: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filtroTextoAtivo: { color: '#FFFFFF' },
  listaContainer: { padding: 16, gap: 10 },
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
  regiaoTag: {
    backgroundColor: '#FDF4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  regiaoTexto: { fontSize: 11, color: '#9333EA', fontWeight: '600' },
  cardNome: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardCientifico: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 4 },
  cardDescricao: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  seta: { fontSize: 22, color: '#D1D5DB', marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTexto: { color: '#6B7280', fontSize: 14 },
  vazioContainer: { alignItems: 'center', paddingTop: 60 },
  vazioTexto: { color: '#9CA3AF', fontSize: 15 },
});
