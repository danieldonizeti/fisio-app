import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

const CATEGORIAS = [
  {
    id: 'musculos',
    titulo: 'Músculos',
    descricao: 'Origem, inserção, função e inervação',
    icone: '💪',
    cor: '#FDF4FF',
    corTexto: '#9333EA',
    endpoint: 'musculos',
  },
  {
    id: 'tendoes',
    titulo: 'Tendões',
    descricao: 'Conexão entre músculo e osso',
    icone: '🔗',
    cor: '#FFF7ED',
    corTexto: '#EA580C',
    endpoint: 'tendoes',
  },
  {
    id: 'ligamentos',
    titulo: 'Ligamentos',
    descricao: 'Estabilização das articulações',
    icone: '⛓️',
    cor: '#FFF1F2',
    corTexto: '#E11D48',
    endpoint: 'ligamentos',
  },
  {
    id: 'ossos',
    titulo: 'Ossos',
    descricao: 'Estrutura base do sistema locomotor',
    icone: '🦴',
    cor: '#F0F9FF',
    corTexto: '#0284C7',
    endpoint: 'ossos',
  },
  {
    id: 'articulacoes',
    titulo: 'Articulações',
    descricao: 'União entre ossos e movimentos',
    icone: '🔄',
    cor: '#F0FDF4',
    corTexto: '#16A34A',
    endpoint: 'articulacoes',
  },
];

export default function AnatomiaScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitulo}>Selecione uma categoria</Text>

      {CATEGORIAS.map((categoria) => (
        <TouchableOpacity
          key={categoria.id}
          style={[styles.card, { backgroundColor: categoria.cor }]}
          onPress={() => navigation.navigate('AnatomiaLista', {
            titulo: categoria.titulo,
            endpoint: categoria.endpoint,
          })}
          activeOpacity={0.7}
        >
          <Text style={styles.cardIcone}>{categoria.icone}</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitulo, { color: categoria.corTexto }]}>
              {categoria.titulo}
            </Text>
            <Text style={styles.cardDescricao}>{categoria.descricao}</Text>
          </View>
          <Text style={styles.seta}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 32 },
  subtitulo: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcone: { fontSize: 32, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardTitulo: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  cardDescricao: { fontSize: 13, color: '#6B7280' },
  seta: { fontSize: 22, color: '#D1D5DB' },
});