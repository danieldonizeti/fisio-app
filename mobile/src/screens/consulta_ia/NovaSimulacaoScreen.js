import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../../services/api';

const NIVEIS = [
  {
    value: 'facil',
    label: 'Fácil',
    descricao: 'Paciente colaborativo, sintomas claros e diretos',
    icone: '😊',
    cor: '#16A34A',
    bg: '#F0FDF4',
  },
  {
    value: 'medio',
    label: 'Médio',
    descricao: 'Paciente com dificuldades de comunicação, sintomas imprecisos',
    icone: '😐',
    cor: '#EA580C',
    bg: '#FFF7ED',
  },
  {
    value: 'dificil',
    label: 'Difícil',
    descricao: 'Paciente confuso, sintomas vagos e histórico complexo',
    icone: '😰',
    cor: '#DC2626',
    bg: '#FEF2F2',
  },
];

export default function NovaSimulacaoScreen({ navigation }) {
  const [nivel, setNivel] = useState('facil');
  const [titulo, setTitulo] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleIniciar() {
    try {
      setCarregando(true);

      // Busca uma patologia aleatória do banco
      const patologiaResponse = await api.get('/api/consulta-ia/patologia-aleatoria/');
      const patologia = patologiaResponse.data;

      // Cria a simulação com a patologia sorteada
      const response = await api.post('/api/consulta-ia/', {
        titulo: titulo || `Simulação ${NIVEIS.find(n => n.value === nivel)?.label}`,
        nivel,
        patologia_simulada: patologia.nome,
      });

      navigation.replace('SimulacaoChat', { id: response.data.id });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a simulação.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcone}>🎯</Text>
        <View style={styles.infoTextoContainer}>
          <Text style={styles.infoTitulo}>Como funciona?</Text>
          <Text style={styles.infoTexto}>
            O sistema sorteará uma patologia automaticamente. Converse com o paciente virtual, faça sua avaliação e tente adivinhar o diagnóstico no final!
          </Text>
        </View>
      </View>

      <Text style={styles.secaoTitulo}>Nível de dificuldade</Text>

      {NIVEIS.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[
            styles.nivelCard,
            nivel === item.value && { borderColor: item.cor, backgroundColor: item.bg },
          ]}
          onPress={() => setNivel(item.value)}
          activeOpacity={0.7}
        >
          <Text style={styles.nivelIcone}>{item.icone}</Text>
          <View style={styles.nivelInfo}>
            <Text style={[styles.nivelLabel, nivel === item.value && { color: item.cor }]}>
              {item.label}
            </Text>
            <Text style={styles.nivelDescricao}>{item.descricao}</Text>
          </View>
          <View style={[
            styles.radio,
            nivel === item.value && { borderColor: item.cor, backgroundColor: item.cor },
          ]}>
            {nivel === item.value && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.botao, carregando && styles.botaoDesabilitado]}
        onPress={handleIniciar}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoTexto}>Iniciar</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 12,
  },
  infoIcone: { fontSize: 28 },
  infoTextoContainer: { flex: 1 },
  infoTitulo: { fontSize: 14, fontWeight: '700', color: '#0369A1', marginBottom: 4 },
  infoTexto: { fontSize: 13, color: '#0369A1', lineHeight: 18 },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  nivelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    paddingBottom:16,
    marginBottom: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  nivelIcone: { fontSize: 28 },
  nivelInfo: { flex: 1 },
  nivelLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 2 },
  nivelDescricao: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  campo: { marginBottom: 14 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#142711',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  botao: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});