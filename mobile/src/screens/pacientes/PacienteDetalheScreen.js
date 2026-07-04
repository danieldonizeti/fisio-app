import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function PacienteDetalheScreen({ route, navigation }) {
  const { id, nome } = route.params;
  const [paciente, setPaciente] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ title: nome });
      buscarPaciente();
    }, [])
  );

  async function buscarPaciente() {
    try {
      setCarregando(true);
      const response = await api.get(`/api/pacientes/${id}/`);
      setPaciente(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o paciente.');
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    );
  }

  if (!paciente) return null;

  const iniciais = `${paciente.nome.split(' ')[0][0]}${paciente.nome.split(' ')[1]?.[0] || ''}`.toUpperCase();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header do paciente */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciais}</Text>
        </View>
        <Text style={styles.nome}>{paciente.nome}</Text>
        <Text style={styles.sub}>
          {paciente.idade} anos · {paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Feminino' : 'Outro'}
        </Text>
        {paciente.profissao ? (
          <Text style={styles.profissao}>{paciente.profissao}</Text>
        ) : null}
      </View>

      {/* Contatos */}
      {(paciente.telefone || paciente.email) && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>📞 Contato</Text>
          {paciente.telefone ? (
            <Text style={styles.secaoTexto}>Telefone: {paciente.telefone}</Text>
          ) : null}
          {paciente.email ? (
            <Text style={styles.secaoTexto}>Email: {paciente.email}</Text>
          ) : null}
        </View>
      )}

      {/* Anamnese */}
      <View style={styles.secao}>
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>📋 Anamnese</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Anamnese', { pacienteId: id, pacienteNome: nome })}
          >
            <Text style={styles.secaoAcao}>
              {paciente.anamnese ? 'Editar' : '+ Preencher'}
            </Text>
          </TouchableOpacity>
        </View>

        {paciente.anamnese ? (
          <View>
            <Text style={styles.anamneseItem}>
              <Text style={styles.anamneseLabel}>Queixa: </Text>
              {paciente.anamnese.queixa_principal}
            </Text>
            <Text style={styles.anamneseItem}>
              <Text style={styles.anamneseLabel}>Dor: </Text>
              {paciente.anamnese.intensidade_dor}/10 — {paciente.anamnese.localizacao_dor}
            </Text>
            {paciente.anamnese.imc ? (
              <Text style={styles.anamneseItem}>
                <Text style={styles.anamneseLabel}>IMC: </Text>
                {paciente.anamnese.imc}
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.vazioTexto}>Anamnese não preenchida ainda.</Text>
        )}
      </View>

      {/* Sessões */}
      <View style={styles.secao}>
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>
            🗓️ Sessões ({paciente.total_sessoes})
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NovaSessao', { pacienteId: id, pacienteNome: nome })}
          >
            <Text style={styles.secaoAcao}>+ Nova</Text>
          </TouchableOpacity>
        </View>

        {paciente.sessoes?.length > 0 ? (
          paciente.sessoes.slice(0, 5).map((sessao) => (
            <View key={sessao.id} style={styles.sessaoCard}>
              <View style={styles.sessaoHeader}>
                <Text style={styles.sessaoNumero}>Sessão {sessao.numero_sessao}</Text>
                <Text style={styles.sessaoData}>{new Date(sessao.data).toLocaleDateString('pt-BR')}</Text>
              </View>
              <Text style={styles.sessaoTexto} numberOfLines={2}>
                {sessao.procedimentos}
              </Text>
              <View style={styles.dorRow}>
                <Text style={styles.dorTexto}>Dor: {sessao.intensidade_dor_atual}/10</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.vazioTexto}>Nenhuma sessão registrada ainda.</Text>
        )}
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
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarTexto: { fontSize: 28, fontWeight: '700', color: '#E11D48' },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  profissao: { fontSize: 13, color: '#9CA3AF' },
  secao: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  secaoTitulo: { fontSize: 15, fontWeight: '700', color: '#111827' },
  secaoAcao: { fontSize: 14, color: '#E11D48', fontWeight: '600' },
  secaoTexto: { fontSize: 14, color: '#374151', lineHeight: 22 },
  anamneseItem: { fontSize: 14, color: '#374151', lineHeight: 24 },
  anamneseLabel: { fontWeight: '600', color: '#111827' },
  vazioTexto: { fontSize: 14, color: '#9CA3AF' },
  sessaoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sessaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessaoNumero: { fontSize: 13, fontWeight: '600', color: '#111827' },
  sessaoData: { fontSize: 13, color: '#6B7280' },
  sessaoTexto: { fontSize: 13, color: '#374151', lineHeight: 18, marginBottom: 6 },
  dorRow: { flexDirection: 'row' },
  dorTexto: { fontSize: 12, color: '#9CA3AF' },
});