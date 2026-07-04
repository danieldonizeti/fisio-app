import React, { useState } from 'react';
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

export default function NovaSessaoScreen({ route, navigation }) {
  const { pacienteId, pacienteNome } = route.params;
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toLocaleDateString('pt-BR'),
    queixa_sessao: '',
    procedimentos: '',
    evolucao: '',
    intensidade_dor_atual: '0',
    proxima_sessao: '',
    observacoes: '',
  });

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function formatarData(texto) {
    const numeros = texto.replace(/\D/g, '');
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
    return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`;
  }

  function converterData(dataBR) {
    const partes = dataBR.split('/');
    if (partes.length !== 3 || partes[2].length !== 4) return null;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  async function handleSalvar() {
    if (!form.procedimentos) {
      Alert.alert('Atenção', 'Preencha os procedimentos realizados.');
      return;
    }

    const dataConvertida = converterData(form.data);
    if (!dataConvertida) {
      Alert.alert('Atenção', 'Data inválida. Use DD/MM/AAAA.');
      return;
    }

    try {
      setSalvando(true);
      const payload = {
        data: dataConvertida,
        queixa_sessao: form.queixa_sessao,
        procedimentos: form.procedimentos,
        evolucao: form.evolucao,
        intensidade_dor_atual: parseInt(form.intensidade_dor_atual) || 0,
        proxima_sessao: form.proxima_sessao ? converterData(form.proxima_sessao) : null,
        observacoes: form.observacoes,
      };
      console.log('Payload:', JSON.stringify(payload));
      const response = await api.post(`/api/pacientes/${pacienteId}/sessoes/`, payload);
      console.log('Resposta:', JSON.stringify(response.data));

      Alert.alert('Sucesso', 'Sessão registrada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.log('Erro status:', error.response?.status);
      console.log('Erro data:', JSON.stringify(error.response?.data));
      Alert.alert('Erro', 'Não foi possível registrar a sessão.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.secaoTitulo}>Dados da Sessão</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Data da sessão</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={10}
          value={form.data}
          onChangeText={(v) => atualizar('data', formatarData(v))}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Como o paciente chegou hoje?</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Queixa do dia, estado geral..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={form.queixa_sessao}
          onChangeText={(v) => atualizar('queixa_sessao', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Procedimentos realizados *</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Descreva o que foi feito na sessão"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={form.procedimentos}
          onChangeText={(v) => atualizar('procedimentos', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Evolução observada</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Progresso do paciente"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={form.evolucao}
          onChangeText={(v) => atualizar('evolucao', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Dor atual: {form.intensidade_dor_atual}/10</Text>
        <View style={styles.escalaContainer}>
          {[0,1,2,3,4,5,6,7,8,9,10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.escalaBtn,
                String(num) === form.intensidade_dor_atual && styles.escalaBtnAtivo,
              ]}
              onPress={() => atualizar('intensidade_dor_atual', String(num))}
            >
              <Text style={[
                styles.escalaBtnTexto,
                String(num) === form.intensidade_dor_atual && styles.escalaBtnTextoAtivo,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Próxima sessão</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={10}
          value={form.proxima_sessao}
          onChangeText={(v) => atualizar('proxima_sessao', formatarData(v))}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Observações adicionais"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={form.observacoes}
          onChangeText={(v) => atualizar('observacoes', v)}
        />
      </View>

      <TouchableOpacity
        style={[styles.botao, salvando && styles.botaoDesabilitado]}
        onPress={handleSalvar}
        disabled={salvando}
      >
        {salvando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoTexto}>Registrar Sessão</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  campo: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputMulti: { textAlignVertical: 'top', minHeight: 80 },
  escalaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  escalaBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escalaBtnAtivo: { backgroundColor: '#E11D48', borderColor: '#E11D48' },
  escalaBtnTexto: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  escalaBtnTextoAtivo: { color: '#FFFFFF' },
  botao: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});