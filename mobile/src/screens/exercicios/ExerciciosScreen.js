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

const CATEGORIAS = [
  { label: 'Todas', value: '' },
  { label: 'Fortalecimento', value: 'fortalecimento' },
  { label: 'Alongamento', value: 'alongamento' },
  { label: 'Propriocepcao', value: 'propriocepcao' },
  { label: 'Mobilidade', value: 'mobilidade' },
  { label: 'Aerobico', value: 'aerobico' },
];

function extrairLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function ExerciciosScreen({ navigation }) {
  const [exercicios, setExercicios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  useEffect(() => {
    buscarExercicios();
  }, [busca, categoriaFiltro]);

  async function buscarExercicios() {
    try {
      setCarregando(true);
      const params = {};
      if (busca) params.search = busca;

      const response = await api.get('/api/exercicios/', { params });
      const lista = extrairLista(response.data);
      const dados = categoriaFiltro
        ? lista.filter((item) => item.categoria === categoriaFiltro)
        : lista;

      setExercicios(dados);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel carregar os exercicios.');
    } finally {
      setCarregando(false);
    }
  }

  function renderExercicio({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ExercicioDetalhe', {
          id: item.id,
          nome: item.nome,
          exercicio: item,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.categoriaTag}>
            <Text style={styles.categoriaTexto}>{item.categoria_display}</Text>
          </View>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <Text style={styles.cardDescricao} numberOfLines={2}>
            {item.descricao}
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoTexto}>{item.nivel_display}</Text>
            <Text style={styles.infoTexto}>{item.series} series</Text>
            <Text style={styles.infoTexto}>{item.repeticoes}</Text>
          </View>
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
          placeholder="Buscar exercicio..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      <FlatList
        horizontal
        data={CATEGORIAS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosLista}
        contentContainerStyle={styles.filtrosContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filtroPill,
              categoriaFiltro === item.value && styles.filtroPillAtivo,
            ]}
            onPress={() => setCategoriaFiltro(item.value)}
          >
            <Text
              style={[
                styles.filtroTexto,
                categoriaFiltro === item.value && styles.filtroTextoAtivo,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
          <Text style={styles.loadingTexto}>Carregando exercicios...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={exercicios}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderExercicio}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioTexto}>Nenhum exercicio encontrado.</Text>
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
  filtroPillAtivo: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
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
  categoriaTag: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoriaTexto: { fontSize: 11, color: '#EA580C', fontWeight: '600' },
  cardNome: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  cardDescricao: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  infoTexto: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  seta: { fontSize: 22, color: '#D1D5DB', marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTexto: { color: '#6B7280', fontSize: 14 },
  vazioContainer: { alignItems: 'center', paddingTop: 60 },
  vazioTexto: { color: '#9CA3AF', fontSize: 15 },
});
