import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
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
  },
  {
    id: 'testes',
    titulo: 'Testes Especiais',
    descricao: 'Testes ortopédicos e neurológicos',
    icone: '🔬',
    cor: '#F0FDF4',
    corIcone: '#16A34A',
    tela: 'Testes',
  },
  {
    id: 'exercicios',
    titulo: 'Exercicios',
    descricao: 'Biblioteca de exercícios terapêuticos',
    icone: '🏃',
    cor: '#FFF7ED',
    corIcone: '#EA580C',
    tela: 'Exercicios',
  },
  {
    id: 'anatomia',
    titulo: 'Anatomia',
    descricao: 'Músculos, ossos, tendões e articulações',
    icone: '💪',
    cor: '#FDF4FF',
    corIcone: '#9333EA',
    tela: 'Anatomia',
  },
  {
    id: 'pacientes',
    titulo: 'Pacientes',
    descricao: 'Gerencie seus pacientes e fichas',
    icone: '👥',
    cor: '#FFF1F2',
    corIcone: '#E11D48',
    tela: 'Pacientes',
  },
  {
    id: 'consulta_ia',
    titulo: 'Simulação IA',
    descricao: 'Simule consultas com paciente virtual',
    icone: '🤖',
    cor: '#F0F9FF',
    corIcone: '#0284C7',
    tela: 'ConsultaIA',
  },
];

export default function HomeScreen({ navigation }) {
  const { usuario, logout } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>
            Olá, {usuario?.first_name} 👋
          </Text>
          <Text style={styles.subtitulo}>O que vamos estudar hoje?</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutTexto}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Grid de módulos */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {MODULOS.map((modulo) => (
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F9FAFB',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  logoutTexto: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47.5%',
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
  },
  iconeContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icone: {
    fontSize: 22,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescricao: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
});