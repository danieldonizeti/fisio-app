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

export default function AnamneseScreen({ route, navigation }) {
  const { pacienteId, pacienteNome } = route.params;
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    queixa_principal: '',
    historia_doenca_atual: '',
    localizacao_dor: '',
    intensidade_dor: '0',
    tipo_dor: '',
    dor_irradia: false,
    irradiacao_descricao: '',
    fatores_piora: '',
    fatores_melhora: '',
    antecedentes_pessoais: '',
    antecedentes_familiares: '',
    medicamentos_em_uso: '',
    alergias: '',
    tratamentos_anteriores: '',
    atividade_fisica: false,
    descricao_atividade_fisica: '',
    tabagismo: false,
    etilismo: false,
    peso: '',
    altura: '',
    pressao_arterial: '',
    objetivo_paciente: '',
    observacoes: '',
  });

  useEffect(() => {
    navigation.setOptions({ title: `Anamnese — ${pacienteNome}` });
    buscarAnamnese();
  }, []);

  async function buscarAnamnese() {
    try {
      const response = await api.get(`/api/pacientes/${pacienteId}/anamnese/`);
      const dados = response.data;
      setForm({
        queixa_principal: dados.queixa_principal || '',
        historia_doenca_atual: dados.historia_doenca_atual || '',
        localizacao_dor: dados.localizacao_dor || '',
        intensidade_dor: String(dados.intensidade_dor || '0'),
        tipo_dor: dados.tipo_dor || '',
        dor_irradia: dados.dor_irradia || false,
        irradiacao_descricao: dados.irradiacao_descricao || '',
        fatores_piora: dados.fatores_piora || '',
        fatores_melhora: dados.fatores_melhora || '',
        antecedentes_pessoais: dados.antecedentes_pessoais || '',
        antecedentes_familiares: dados.antecedentes_familiares || '',
        medicamentos_em_uso: dados.medicamentos_em_uso || '',
        alergias: dados.alergias || '',
        tratamentos_anteriores: dados.tratamentos_anteriores || '',
        atividade_fisica: dados.atividade_fisica || false,
        descricao_atividade_fisica: dados.descricao_atividade_fisica || '',
        tabagismo: dados.tabagismo || false,
        etilismo: dados.etilismo || false,
        peso: dados.peso ? String(dados.peso) : '',
        altura: dados.altura ? String(dados.altura) : '',
        pressao_arterial: dados.pressao_arterial || '',
        objetivo_paciente: dados.objetivo_paciente || '',
        observacoes: dados.observacoes || '',
      });
    } catch {
  
    } finally {
      setCarregando(false);
    }
  }

  function atualizar(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSalvar() {
    if (!form.queixa_principal || !form.historia_doenca_atual) {
      Alert.alert('Atenção', 'Preencha a queixa principal e a história da doença.');
      return;
    }

    try {
      setSalvando(true);
      await api.post(`/api/pacientes/${pacienteId}/anamnese/`, {
        ...form,
        intensidade_dor: parseInt(form.intensidade_dor) || 0,
        peso: form.peso ? parseFloat(form.peso) : null,
        altura: form.altura ? parseFloat(form.altura) : null,
      });
      Alert.alert('Sucesso', 'Anamnese salva com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a anamnese.');
    } finally {
      setSalvando(false);
    }
  }

  function Toggle({ value, onToggle }) {
    return (
      <TouchableOpacity
        style={[styles.toggle, value && styles.toggleAtivo]}
        onPress={onToggle}
      >
        <Text style={[styles.toggleTexto, value && styles.toggleTextoAtivo]}>
          {value ? 'Sim' : 'Não'}
        </Text>
      </TouchableOpacity>
    );
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E11D48" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Queixa principal */}
      <Text style={styles.secaoTitulo}>Queixa Principal</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Queixa principal *</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Motivo principal da consulta"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={form.queixa_principal}
          onChangeText={(v) => atualizar('queixa_principal', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>História da doença atual *</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Início, evolução e características da queixa"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={form.historia_doenca_atual}
          onChangeText={(v) => atualizar('historia_doenca_atual', v)}
        />
      </View>

      {/* Dor */}
      <Text style={styles.secaoTitulo}>Avaliação da Dor</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Localização da dor</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Ombro direito"
          placeholderTextColor="#9CA3AF"
          value={form.localizacao_dor}
          onChangeText={(v) => atualizar('localizacao_dor', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Intensidade da dor: {form.intensidade_dor}/10</Text>
        <View style={styles.escalaContainer}>
          {[0,1,2,3,4,5,6,7,8,9,10].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.escalaBtn,
                String(num) === form.intensidade_dor && styles.escalaBtnAtivo,
              ]}
              onPress={() => atualizar('intensidade_dor', String(num))}
            >
              <Text style={[
                styles.escalaBtnTexto,
                String(num) === form.intensidade_dor && styles.escalaBtnTextoAtivo,
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Tipo de dor</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: queimação, pontada, peso"
          placeholderTextColor="#9CA3AF"
          value={form.tipo_dor}
          onChangeText={(v) => atualizar('tipo_dor', v)}
        />
      </View>

      <View style={styles.campo}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Dor irradia?</Text>
          <Toggle
            value={form.dor_irradia}
            onToggle={() => atualizar('dor_irradia', !form.dor_irradia)}
          />
        </View>
        {form.dor_irradia && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Para onde irradia?"
            placeholderTextColor="#9CA3AF"
            value={form.irradiacao_descricao}
            onChangeText={(v) => atualizar('irradiacao_descricao', v)}
          />
        )}
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Fatores de piora</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="O que piora a dor?"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
          value={form.fatores_piora}
          onChangeText={(v) => atualizar('fatores_piora', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Fatores de melhora</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="O que melhora a dor?"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
          value={form.fatores_melhora}
          onChangeText={(v) => atualizar('fatores_melhora', v)}
        />
      </View>

      {/* Histórico */}
      <Text style={styles.secaoTitulo}>Histórico</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Antecedentes pessoais</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Doenças, cirurgias, internações anteriores"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={form.antecedentes_pessoais}
          onChangeText={(v) => atualizar('antecedentes_pessoais', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Medicamentos em uso</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Liste os medicamentos"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
          value={form.medicamentos_em_uso}
          onChangeText={(v) => atualizar('medicamentos_em_uso', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Alergias</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Dipirona, látex"
          placeholderTextColor="#9CA3AF"
          value={form.alergias}
          onChangeText={(v) => atualizar('alergias', v)}
        />
      </View>

      {/* Hábitos */}
      <Text style={styles.secaoTitulo}>Hábitos e Estilo de Vida</Text>

      <View style={styles.campo}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Pratica atividade física?</Text>
          <Toggle
            value={form.atividade_fisica}
            onToggle={() => atualizar('atividade_fisica', !form.atividade_fisica)}
          />
        </View>
        {form.atividade_fisica && (
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Qual atividade e frequência?"
            placeholderTextColor="#9CA3AF"
            value={form.descricao_atividade_fisica}
            onChangeText={(v) => atualizar('descricao_atividade_fisica', v)}
          />
        )}
      </View>

      <View style={styles.campoRow}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Tabagismo?</Text>
          <Toggle
            value={form.tabagismo}
            onToggle={() => atualizar('tabagismo', !form.tabagismo)}
          />
        </View>
        <View style={[styles.toggleRow, { marginLeft: 24 }]}>
          <Text style={styles.label}>Etilismo?</Text>
          <Toggle
            value={form.etilismo}
            onToggle={() => atualizar('etilismo', !form.etilismo)}
          />
        </View>
      </View>

      {/* Dados clínicos */}
      <Text style={styles.secaoTitulo}>Dados Clínicos</Text>

      <View style={styles.campoRow}>
        <View style={[styles.campo, { flex: 1 }]}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 70.5"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={form.peso}
            onChangeText={(v) => atualizar('peso', v)}
          />
        </View>
        <View style={[styles.campo, { flex: 1, marginLeft: 12 }]}>
          <Text style={styles.label}>Altura (m)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1.70"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={form.altura}
            onChangeText={(v) => atualizar('altura', v)}
          />
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Pressão arterial</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 120/80"
          placeholderTextColor="#9CA3AF"
          value={form.pressao_arterial}
          onChangeText={(v) => atualizar('pressao_arterial', v)}
        />
      </View>

      {/* Objetivo */}
      <Text style={styles.secaoTitulo}>Objetivo</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Objetivo do paciente</Text>
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="O que o paciente espera do tratamento?"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          value={form.objetivo_paciente}
          onChangeText={(v) => atualizar('objetivo_paciente', v)}
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
          <Text style={styles.botaoTexto}>Salvar Anamnese</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 20,
  },
  campo: { marginBottom: 14 },
  campoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  toggleAtivo: { backgroundColor: '#E11D48', borderColor: '#E11D48' },
  toggleTexto: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  toggleTextoAtivo: { color: '#FFFFFF' },
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