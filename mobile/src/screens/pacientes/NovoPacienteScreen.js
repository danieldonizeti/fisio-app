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

export default function NovoPacienteScreen({ navigation }) {
  const [carregando, setCarregando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    email: '',
    profissao: '',
    endereco: '',
  });

  function atualizarCampo(campo, valor) {
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
    if (partes.length !== 3) return null;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }

  async function handleSalvar() {
    if (!form.nome || !form.data_nascimento || !form.sexo) {
      Alert.alert('Atenção', 'Preencha nome, data de nascimento e sexo.');
      return;
    }

    const dataConvertida = converterData(form.data_nascimento);
    if (!dataConvertida) {
      Alert.alert('Atenção', 'Data de nascimento inválida. Use DD/MM/AAAA.');
      return;
    }

    try {
      setCarregando(true);
      await api.post('/api/pacientes/', {
        ...form,
        data_nascimento: dataConvertida,
      });

      Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const mensagem =
        error.response?.data?.nome?.[0] ||
        error.response?.data?.data_nascimento?.[0] ||
        'Erro ao cadastrar paciente.';
      Alert.alert('Erro', mensagem);
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
      {/* Dados pessoais */}
      <Text style={styles.secaoTitulo}>Dados Pessoais</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Nome completo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: João da Silva"
          placeholderTextColor="#9CA3AF"
          value={form.nome}
          onChangeText={(v) => atualizarCampo('nome', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Data de nascimento *</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={10}
          value={form.data_nascimento}
          onChangeText={(v) => atualizarCampo('data_nascimento', formatarData(v))}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Sexo *</Text>
        <View style={styles.sexoContainer}>
          {[
            { label: 'Masculino', value: 'M' },
            { label: 'Feminino', value: 'F' },
            { label: 'Outro', value: 'O' },
          ].map((opcao) => (
            <TouchableOpacity
              key={opcao.value}
              style={[
                styles.sexoOpcao,
                form.sexo === opcao.value && styles.sexoOpcaoAtiva,
              ]}
              onPress={() => atualizarCampo('sexo', opcao.value)}
            >
              <Text style={[
                styles.sexoTexto,
                form.sexo === opcao.value && styles.sexoTextoAtivo,
              ]}>
                {opcao.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Telefone</Text>
        <TextInput
          style={styles.input}
          placeholder="(16) 99999-9999"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          value={form.telefone}
          onChangeText={(v) => atualizarCampo('telefone', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@exemplo.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(v) => atualizarCampo('email', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Profissão</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Professor"
          placeholderTextColor="#9CA3AF"
          value={form.profissao}
          onChangeText={(v) => atualizarCampo('profissao', v)}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Endereço</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Rua das Flores, 123"
          placeholderTextColor="#9CA3AF"
          value={form.endereco}
          onChangeText={(v) => atualizarCampo('endereco', v)}
        />
      </View>

      <TouchableOpacity
        style={[styles.botao, carregando && styles.botaoDesabilitado]}
        onPress={handleSalvar}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.botaoTexto}>Cadastrar Paciente</Text>
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
  sexoContainer: { flexDirection: 'row', gap: 8 },
  sexoOpcao: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  sexoOpcaoAtiva: { backgroundColor: '#E11D48', borderColor: '#E11D48' },
  sexoTexto: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  sexoTextoAtivo: { color: '#FFFFFF' },
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