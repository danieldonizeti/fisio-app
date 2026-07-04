import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import api from '../../services/api';

export default function TesteDetalheScreen({ route, navigation }) {
  const { id, nome, teste: testeInicial } = route.params;
  const [teste, setTeste] = useState(testeInicial || null);
  const [carregando, setCarregando] = useState(!testeInicial);

  useEffect(() => {
    navigation.setOptions({ title: nome });
    buscarTeste();
  }, []);

  async function buscarTeste() {
    try {
      const response = await api.get(`/api/teste/${id}/`);
      setTeste(response.data);
    } catch (error) {
      console.warn('Erro ao carregar teste', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data,
      });
      if (!testeInicial) {
        Alert.alert('Erro', 'Não foi possível carregar o teste.');
      }
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    );
  }

  if (!teste) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.estruturaTag}>
          <Text style={styles.estruturaTexto}>{teste.estrutura_display}</Text>
        </View>

        {/* Sensibilidade e Especificidade */}
        {teste.sensibilidade ? (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{teste.sensibilidade}%</Text>
              <Text style={styles.statLabel}>Sensibilidade</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValor}>{teste.especificidade}%</Text>
              <Text style={styles.statLabel}>Especificidade</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Descrição */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>📋 O que é</Text>
        <Text style={styles.secaoTexto}>{teste.descricao}</Text>
      </View>

      {/* Como realizar */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>👐 Como realizar</Text>
        <Text style={styles.secaoTexto}>{teste.como_realizar}</Text>
      </View>

      {/* Achados */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>🔍 Interpretação</Text>

        <View style={styles.achadoCard}>
          <View style={styles.achadoHeader}>
            <View style={[styles.achadoDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.achadoTitulo}>Positivo</Text>
          </View>
          <Text style={styles.achadoTexto}>{teste.achado_positivo}</Text>
        </View>

        {teste.achado_negativo ? (
          <View style={[styles.achadoCard, { marginTop: 10 }]}>
            <View style={styles.achadoHeader}>
              <View style={[styles.achadoDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.achadoTitulo}>Negativo</Text>
            </View>
            <Text style={styles.achadoTexto}>{teste.achado_negativo}</Text>
          </View>
        ) : null}
      </View>

      {/* Patologias relacionadas */}
      {teste.patologias_relacionadas?.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>🦴 Patologias Relacionadas</Text>
          {teste.patologias_relacionadas.map((patologia) => (
            <TouchableOpacity
              key={patologia.id}
              style={styles.itemRelacionado}
              onPress={() => navigation.navigate('PatologiaDetalhe', {
                id: patologia.id,
                nome: patologia.nome
              })}
            >
              <View style={styles.itemIcone}>
                  <Text style={styles.itemIconeTexto}>🦴 </Text>
              </View>
              <View style={styles.itemRelacionadoInfo}>
                <Text style={styles.itemRelacionadoNome}>{patologia.nome}</Text>
                <Text style={styles.itemRelacionadoSub}>{patologia.regiao_display}</Text>
              </View>
              <Text style={styles.seta}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  estruturaTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  estruturaTexto: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  secao: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  secaoTexto: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  achadoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achadoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  achadoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  achadoTexto: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  itemRelacionado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemRelacionadoInfo: {
    flex: 1,
  },
  itemRelacionadoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemRelacionadoSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  seta: {
    fontSize: 22,
    color: '#D1D5DB',
  },
});
