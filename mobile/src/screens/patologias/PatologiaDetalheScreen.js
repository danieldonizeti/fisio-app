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

export default function PatologiaDetalheScreen({ route, navigation }) {
  const { id, nome, patologia: patologiaInicial } = route.params;
  const [patologia, setPatologia] = useState(patologiaInicial || null);
  const [carregando, setCarregando] = useState(!patologiaInicial);

  useEffect(() => {
    navigation.setOptions({ title: nome });
    buscarPatologia();
  }, []);

  async function buscarPatologia() {
    try {
      const response = await api.get(`/api/patologias/${id}/`);
      setPatologia(response.data);
    } catch (error) {
      if (!patologiaInicial) {
        Alert.alert('Erro', 'Não foi possível carregar a patologia.');
      }
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!patologia) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header da patologia — sem repetir o título */}
      <View style={styles.header}>
        <View style={styles.regiaoTag}>
          <Text style={styles.regiaoTexto}>{patologia.regiao_display}</Text>
        </View>
        {patologia.descricao ? (
          <Text style={styles.headerDescricao}>{patologia.descricao}</Text>
        ) : null}
      </View>

      {/* Causas */}
      {patologia.causas ? (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>⚠️ Causas</Text>
          <Text style={styles.secaoTexto}>{patologia.causas}</Text>
        </View>
      ) : null}

      {/* Tratamento */}
      {patologia.tratamento ? (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>💊 Tratamento</Text>
          <Text style={styles.secaoTexto}>{patologia.tratamento}</Text>
        </View>
      ) : null}

      {/* Sintomas */}
      {patologia.sintomas_relacionados?.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>🩺 Sintomas</Text>
          <View style={styles.chipsContainer}>
            {patologia.sintomas_relacionados.map((sintoma) => (
              <View key={sintoma.id} style={styles.chip}>
                <Text style={styles.chipTexto}>{sintoma.descricao}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Testes relacionados */}
      {patologia.testes_relacionados?.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>🔬 Testes Relacionados</Text>
          {patologia.testes_relacionados.map((teste, index) => (
            <TouchableOpacity
              key={teste.id}
              style={[
                styles.itemRelacionado,
                index === patologia.testes_relacionados.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => navigation.navigate('TesteDetalhe', {
                id: teste.id,
                nome: teste.nome,
              })}
            >
              <View style={styles.itemIcone}>
                <Text style={styles.itemIconeTexto}>🔬</Text>
              </View>
              <View style={styles.itemRelacionadoInfo}>
                <Text style={styles.itemRelacionadoNome}>{teste.nome}</Text>
                <Text style={styles.itemRelacionadoSub}>{teste.estrutura_display}</Text>
              </View>
              <Text style={styles.seta}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Exercícios sugeridos */}
      {patologia.exercicios_relacionados?.length > 0 && (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>🏃 Exercícios Sugeridos</Text>
          {patologia.exercicios_relacionados.map((exercicio, index) => (
            <TouchableOpacity
              key={exercicio.id}
              style={[
                styles.itemRelacionado,
                index === patologia.exercicios_relacionados.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => navigation.navigate('ExercicioDetalhe', {
                id: exercicio.id,
                nome: exercicio.nome,
              })}
            >
              <View style={styles.itemIcone}>
                <Text style={styles.itemIconeTexto}>🏃</Text>
              </View>
              <View style={styles.itemRelacionadoInfo}>
                <Text style={styles.itemRelacionadoNome}>{exercicio.nome}</Text>
                <Text style={styles.itemRelacionadoSub}>
                  {exercicio.nivel_display} · {exercicio.categoria_display}
                </Text>
              </View>
              <Text style={styles.seta}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  regiaoTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  regiaoTexto: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerDescricao: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  secao: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  secaoTexto: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  chipTexto: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  itemRelacionado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  itemIcone: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconeTexto: { fontSize: 16 },
  itemRelacionadoInfo: { flex: 1 },
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
    fontSize: 20,
    color: '#D1D5DB',
  },
});