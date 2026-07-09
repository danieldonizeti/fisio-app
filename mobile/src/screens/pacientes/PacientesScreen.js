import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function PacientesScreen({ navigation }) {
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');


  useFocusEffect(
    useCallback(() => {
      buscarPacientes();
    }, [busca])
  );

  async function buscarPacientes() {
    try {
      setCarregando(true);
      const params = {};
      if (busca) params.search = busca;
      const response = await api.get('/api/pacientes/', { params });
      setPacientes(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os pacientes.');
    } finally {
      setCarregando(false);
    }
  }

  function renderPaciente({ item }) {
    const iniciais = `${item.nome.split(' ')[0][0]}${item.nome.split(' ')[1]?.[0] || ''}`.toUpperCase();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PacienteDetalhe', { id: item.id, nome: item.nome })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{item.nome}</Text>
          <Text style={styles.cardSub}>
            {item.idade} anos · {item.sexo === 'M' ? 'Masculino' : item.sexo === 'F' ? 'Feminino' : 'Outro'}
          </Text>
          <Text style={styles.cardSessoes}>
            {item.total_sessoes} {item.total_sessoes === 1 ? 'sessão' : 'sessões'}
          </Text>
        </View>
        <View style={styles.cardRight}>
          {!item.ativo && (
            <View style={styles.inativoTag}>
              <Text style={styles.inativoTexto}>Inativo</Text>
            </View>
          )}
          <Text style={styles.seta}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Pacientes</Text>
        <TouchableOpacity
          style={styles.novoBotao}
          onPress={() => navigation.navigate('NovoPaciente')}
        >
          <Text style={styles.novoBotaoTexto}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.buscaContainer}>
        <TextInput
          style={styles.buscaInput}
          placeholder="🔍 Buscar paciente..."
          placeholderTextColor="#9CA3AF"
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={styles.loadingTexto}>Carregando pacientes...</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={pacientes}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderPaciente}
          contentContainerStyle={styles.listaContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Text style={styles.vazioIcone}>👥</Text>
              <Text style={styles.vazioTitulo}>Nenhum paciente cadastrado</Text>
              <Text style={styles.vazioSub}>Toque em "+ Novo" para adicionar</Text>
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
    backgroundColor: '#E11D48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  novoBotaoTexto: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  buscaContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  buscaInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listaContainer: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTexto: { fontSize: 16, fontWeight: '700', color: '#E11D48' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  cardSessoes: { fontSize: 12, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  inativoTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inativoTexto: { fontSize: 11, color: '#9CA3AF' },
  seta: { fontSize: 22, color: '#D1D5DB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTexto: { color: '#6B7280', fontSize: 14 },
  vazioContainer: { alignItems: 'center', paddingTop: 80 },
  vazioIcone: { fontSize: 48, marginBottom: 12 },
  vazioTitulo: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4 },
  vazioSub: { fontSize: 14, color: '#9CA3AF' },
});