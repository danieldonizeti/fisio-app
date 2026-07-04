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
  { label: 'Ombro', value: 'ombro' },
  { label: 'Joelho', value: 'joelho' },
  { label: 'Quadril', value: 'quadril' },
  { label: 'Coluna', value: 'coluna' },
  { label: 'Cotovelo', value: 'cotovelo' },
  { label: 'Punho', value: 'punho' },
  { label: 'Tornozelo', value: 'tornozelo' },
  { label: 'Outros', value: 'outros' },
];

function extrairLista(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function PatologiasScreen({ navigation }) {
  const [patologias, setPatologias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [regiaoFiltro, setRegiaoFiltro] = useState('');

  useEffect(() => {
    buscarPatologias();
  }, [busca, regiaoFiltro]);

  async function buscarPatologias() {
    try {
      setCarregando(true);
      const params = {};
      if (busca) params.search = busca;

      const response = await api.get('/api/patologias/', { params });
      const lista = extrairLista(response.data);
      const dados = regiaoFiltro
        ? lista.filter((item) => item.regiao === regiaoFiltro)
        : lista;

      setPatologias(dados);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as patologias.');
    } finally {
      setCarregando(false);
    }
  }

  function renderPatologia({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PatologiaDetalhe', {
          id: item.id,
          nome: item.nome,
          patologia: item,
        })}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.regiaoTag}>
            <Text style={styles.regiaoTexto}>{item.regiao_display}</Text>
          </View>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <Text style={styles.cardDescricao} numberOfLines={2}>
            {item.descricao}
          </Text>
        </View>
        <Text style={styles.seta}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Busca */}
      <View style={styles.buscaContainer}>
        <TextInput
          style={styles.buscaInput}
          placeholder="🔍 Buscar patologia..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Filtros de região */}
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
            <Text
              style={[
                styles.filtroTexto,
                regiaoFiltro === item.value && styles.filtroTextoAtivo,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Lista */}
      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingTexto}>Carregando patologias...</Text>
        </View>
      ) : (
        <FlatList
          data={patologias}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPatologia}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioTexto}>Nenhuma patologia encontrada.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  buscaContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
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
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
  filtroPillAtivo: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filtroTexto: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filtroTextoAtivo: {
    color: '#FFFFFF',
  },
  listaContainer: {
    padding: 16,
    gap: 10,
  },
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
  cardLeft: {
    flex: 1,
  },
  regiaoTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  regiaoTexto: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  cardNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescricao: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  seta: {
    fontSize: 24,
    color: '#D1D5DB',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingTexto: {
    color: '#6B7280',
    fontSize: 14,
  },
  vazioContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  vazioTexto: {
    color: '#9CA3AF',
    fontSize: 15,
  },
});
