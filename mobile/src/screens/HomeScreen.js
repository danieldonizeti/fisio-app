import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const MODULOS = [
  {
    id: 'patologias',
    titulo: 'Patologias',
    descricao: 'Explore patologias, sintomas e tratamentos',
    icone: '🦴',
    cor: '#EFF6FF',
    corIcone: '#2563EB',
    tela: 'Patologias',
    tags: ['patologia', 'doença', 'sintoma', 'tratamento'],
  },
  {
    id: 'testes',
    titulo: 'Testes Especiais',
    descricao: 'Testes ortopédicos e neurológicos',
    icone: '🔬',
    cor: '#F0FDF4',
    corIcone: '#16A34A',
    tela: 'Testes',
    tags: ['teste', 'ortopédico', 'neurológico', 'avaliação'],
  },
  {
    id: 'exercicios',
    titulo: 'Exercícios',
    descricao: 'Biblioteca de exercícios terapêuticos',
    icone: '🏃',
    cor: '#FFF7ED',
    corIcone: '#EA580C',
    tela: 'Exercicios',
    tags: ['exercício', 'terapêutico', 'fortalecimento', 'alongamento'],
  },
  {
    id: 'anatomia',
    titulo: 'Anatomia',
    descricao: 'Músculos, ossos, tendões e articulações',
    icone: '💪',
    cor: '#FDF4FF',
    corIcone: '#9333EA',
    tela: 'Anatomia',
    tags: ['músculo', 'osso', 'tendão', 'articulação', 'ligamento'],
  },
  {
    id: 'pacientes',
    titulo: 'Pacientes',
    descricao: 'Gerencie seus pacientes e fichas',
    icone: '👥',
    cor: '#FFF1F2',
    corIcone: '#E11D48',
    tela: 'Pacientes',
    tags: ['paciente', 'ficha', 'anamnese', 'sessão'],
  },
  {
    id: 'consulta_ia',
    titulo: 'Simulação IA',
    descricao: 'Simule consultas com paciente virtual',
    icone: '🤖',
    cor: '#F0F9FF',
    corIcone: '#0284C7',
    tela: 'ConsultaIA',
    tags: ['ia', 'simulação', 'diagnóstico', 'consulta'],
  },
];

export default function HomeScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const [busca, setBusca] = useState('');

  const modulosFiltrados = busca.trim()
    ? MODULOS.filter((m) =>
        m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        m.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        m.tags.some((t) => t.includes(busca.toLowerCase()))
      )
    : MODULOS;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saudacao}>{saudacao}, {usuario?.first_name} 👋</Text>
            <Text style={styles.subtitulo}>O que vamos estudar hoje?</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutTexto}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Busca global */}
        <View style={styles.buscaContainer}>
          <View style={styles.buscaInputContainer}>
            <Text style={styles.buscaIcone}>🔍</Text>
            <TextInput
              style={styles.buscaInput}
              placeholder="Buscar testes, patologias ...."
              placeholderTextColor="#9CA3AF"
              value={busca}
              onChangeText={setBusca}
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')}>
                <Text style={styles.buscaLimpar}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
    

        {/* Grid de módulos */}
        <Text style={styles.secaoLabel}>
          {busca.length > 0 ? `${modulosFiltrados.length} resultado(s)` : 'Módulos'}
        </Text>

        {modulosFiltrados.length === 0 ? (
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioIcone}>🔍</Text>
            <Text style={styles.vazioTexto}>Nenhum módulo encontrado</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {modulosFiltrados.map((modulo) => (
              <TouchableOpacity
                key={modulo.id}
                style={[styles.card, { backgroundColor: modulo.cor }]}
                onPress={() => navigation.navigate(modulo.tela)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconeContainer, { backgroundColor: modulo.corIcone + '20' }]}>
                  <Text style={styles.icone}>{modulo.icone}</Text>
                </View>
                <Text style={[styles.cardTitulo, { color: modulo.corIcone }]}>
                  {modulo.titulo}
                </Text>
                <Text style={styles.cardDescricao}>{modulo.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
  paddingBottom: 16,
},
  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingTop: 56,
  paddingBottom: 12,
},
  saudacao: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutBtn: {
  paddingHorizontal: 10,
  paddingVertical: 6,
  backgroundColor: '#FEE2E2',
  borderRadius: 8,
},
 logoutTexto: {
  color: '#DC2626',
  fontWeight: '600',
  fontSize: 12,
},
  buscaContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  buscaInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buscaIcone: { fontSize: 16 },
  buscaInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  buscaLimpar: {
    fontSize: 14,
    color: '#9CA3AF',
    paddingHorizontal: 4,
  },
  atalhosContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  atalhosLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  atalho: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  atalhoIcone: { fontSize: 14 },
  atalhoLabel: { fontSize: 13, color: '#374151', fontWeight: '500' },
  secaoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
  width: '47.5%',
  borderRadius: 16,
  padding: 14,
  minHeight: 120,  // era 140
},
 iconeContainer: {
  width: 40,
  height: 40,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,  // era 12
},
icone: { fontSize: 20 }, 
cardTitulo: {
  fontSize: 14, 
  fontWeight: '700',
  marginBottom: 3,
},
 cardDescricao: {
  fontSize: 11,  // era 12
  color: '#6B7280',
  lineHeight: 15,
},
  vazioContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  vazioIcone: { fontSize: 40, marginBottom: 8 },
  vazioTexto: { fontSize: 15, color: '#9CA3AF' },
});