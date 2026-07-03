import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import api from '../../services/api';

export default function SimulacaoChatScreen({ route, navigation }) {
  const { id } = route.params;
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [simulacao, setSimulacao] = useState(null);
  const [modalDiagnostico, setModalDiagnostico] = useState(false);
  const [diagnostico, setDiagnostico] = useState('');
  const [submetendo, setSubmetendo] = useState(false);
  const flatListRef = useRef(null);
  const [feedbackIA, setFeedbackIA] = useState(null);
  const [modalFeedback, setModalFeedback] = useState(false);

  useEffect(() => {
    buscarHistorico();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: simulacao?.titulo || 'Simulação',
    });
  }, [simulacao]);

  async function buscarHistorico() {
  try {
    setCarregando(true);
    const [histResponse, simResponse] = await Promise.all([
      api.get(`/api/consulta-ia/${id}/historico/`),
      api.get(`/api/consulta-ia/${id}/`),
    ]);
    setMensagens(histResponse.data);
    setSimulacao(simResponse.data);
  } catch (error) {
    console.log('Erro status:', error.response?.status);
    console.log('Erro data:', JSON.stringify(error.response?.data));
    console.log('Erro message:', error.message);
    Alert.alert('Erro', 'Não foi possível carregar o histórico.');
  } finally {
    setCarregando(false);
  }
}

  async function handleEnviar() {
    if (!texto.trim() || enviando) return;
    if (!simulacao?.ativa) {
      Alert.alert('Simulação finalizada', 'Esta simulação já foi encerrada.');
      return;
    }

    const mensagemFisio = {
      id: Date.now(),
      remetente: 'fisio',
      conteudo: texto.trim(),
      criado_em: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, mensagemFisio]);
    setTexto('');
    setEnviando(true);

    try {
      const response = await api.post(`/api/consulta-ia/${id}/enviar-mensagem/`, {
        mensagem: mensagemFisio.conteudo,
      });

      const respostaPaciente = {
        id: Date.now() + 1,
        remetente: 'paciente',
        conteudo: response.data.conteudo,
        criado_em: new Date().toISOString(),
      };

      setMensagens((prev) => [...prev, respostaPaciente]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  }

async function handleSubmeterDiagnostico() {
  if (!diagnostico.trim()) {
    Alert.alert('Atenção', 'Digite seu diagnóstico antes de submeter.');
    return;
  }

  try {
    setSubmetendo(true);
    const response = await api.post(
      `/api/consulta-ia/${id}/submeter-diagnostico/`,
      { diagnostico }
    );

    setModalDiagnostico(false);
    setDiagnostico('');
    setSimulacao((prev) => ({ ...prev, ativa: false }));

    // Mostra o feedback da IA em um modal dedicado
    setFeedbackIA({
      patologia_real: response.data.patologia_real,
      diagnostico_submetido: response.data.diagnostico_submetido,
      feedback: response.data.feedback,
    });
    setModalFeedback(true);

  } catch {
    Alert.alert('Erro', 'Não foi possível submeter o diagnóstico.');
  } finally {
    setSubmetendo(false);
  }
}

  function renderMensagem({ item }) {
    const isFisio = item.remetente === 'fisio';
    return (
      <View style={[styles.mensagemContainer, isFisio && styles.mensagemFisioContainer]}>
        {!isFisio && (
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>🤒</Text>
          </View>
        )}
        <View style={[styles.balao, isFisio ? styles.balaoFisio : styles.balaoPaciente]}>
          <Text style={[styles.balaoTexto, isFisio && styles.balaoTextoFisio]}>
            {item.conteudo}
          </Text>
        </View>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Status */}
      {simulacao && (
        <View style={[
          styles.statusBar,
          { backgroundColor: simulacao.ativa ? '#F0F9FF' : '#F3F4F6' },
        ]}>
          <Text style={styles.statusTexto}>
            {simulacao.ativa
              ? `🟢 Nível: ${simulacao.nivel_display} · Avalie o paciente`
              : '🔴 Simulação finalizada'}
          </Text>
        </View>
      )}

      {/* Mensagens */}
      <FlatList
        ref={flatListRef}
        data={mensagens}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMensagem}
        contentContainerStyle={styles.listaContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.vazioContainer}>
            <Text style={styles.vazioIcone}>👋</Text>
            <Text style={styles.vazioTexto}>
              Inicie a consulta cumprimentando o paciente!
            </Text>
          </View>
        }
      />

      {/* Digitando */}
      {enviando && (
        <View style={styles.digitandoContainer}>
          <Text style={styles.digitandoTexto}>Paciente digitando...</Text>
          <ActivityIndicator size="small" color="#6B7280" style={{ marginLeft: 8 }} />
        </View>
      )}

      {/* Botão diagnosticar */}
        {simulacao?.ativa && mensagens.length >= 4 && (
    <TouchableOpacity
        style={styles.diagnosticarBtn}
        onPress={() => {
        setModalDiagnostico(true);
        }}
    >
        <Text style={styles.diagnosticarTexto}>🔍 Submeter diagnóstico</Text>
    </TouchableOpacity>
)}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={simulacao?.ativa ? 'Digite sua mensagem...' : 'Simulação encerrada'}
          placeholderTextColor="#9CA3AF"
          value={texto}
          onChangeText={setTexto}
          editable={simulacao?.ativa && !enviando}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.enviarBtn,
            (!texto.trim() || enviando || !simulacao?.ativa) && styles.enviarBtnDesabilitado,
          ]}
          onPress={handleEnviar}
          disabled={!texto.trim() || enviando || !simulacao?.ativa}
        >
          <Text style={styles.enviarIcone}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* Modal diagnóstico */}
      <Modal
        visible={modalDiagnostico}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDiagnostico(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>🔍 Qual é o seu diagnóstico?</Text>
            <Text style={styles.modalSubtitulo}>
              Com base na anamnese, qual patologia você identificou?
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Síndrome do manguito rotador"
              placeholderTextColor="#9CA3AF"
              value={diagnostico}
              onChangeText={setDiagnostico}
              autoFocus
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.modalCancelar}
                onPress={() => {
                  setModalDiagnostico(false);
                  setDiagnostico('');
                }}
              >
                <Text style={styles.modalCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmar, submetendo && { opacity: 0.6 }]}
                onPress={handleSubmeterDiagnostico}
                disabled={submetendo}
              >
                {submetendo ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmarTexto}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal feedback da IA */}
<Modal
  visible={modalFeedback}
  transparent
  animationType="slide"
  onRequestClose={() => setModalFeedback(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>

      <Text style={styles.feedbackTitulo}>📋 Avaliação do Professor IA</Text>

      <View style={styles.feedbackPatologiaCard}>
        <Text style={styles.feedbackPatologiaLabel}>Patologia do caso</Text>
        <Text style={styles.feedbackPatologiaValor}>{feedbackIA?.patologia_real}</Text>
      </View>

      <View style={styles.feedbackDiagnosticoCard}>
        <Text style={styles.feedbackDiagnosticoLabel}>Seu diagnóstico</Text>
        <Text style={styles.feedbackDiagnosticoValor}>{feedbackIA?.diagnostico_submetido}</Text>
      </View>

      <View style={styles.feedbackTextoCard}>
        <Text style={styles.feedbackTextoLabel}>💬 Feedback</Text>
        <Text style={styles.feedbackTexto}>{feedbackIA?.feedback}</Text>
      </View>

      <TouchableOpacity
        style={styles.feedbackBotao}
        onPress={() => setModalFeedback(false)}
      >
        <Text style={styles.feedbackBotaoTexto}>Entendido!</Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusTexto: { fontSize: 12, color: '#0369A1', fontWeight: '500' },
  listaContainer: { padding: 16, paddingBottom: 8 },
  mensagemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  mensagemFisioContainer: { flexDirection: 'row-reverse' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarTexto: { fontSize: 16 },
  balao: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  balaoPaciente: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  balaoFisio: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 4,
  },
  balaoTexto: { fontSize: 15, color: '#111827', lineHeight: 20 },
  balaoTextoFisio: { color: '#FFFFFF' },
  digitandoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  digitandoTexto: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  diagnosticarBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  diagnosticarTexto: { color: '#0284C7', fontWeight: '600', fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
  },
  enviarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enviarBtnDesabilitado: { backgroundColor: '#BAE6FD' },
  enviarIcone: { color: '#FFFFFF', fontSize: 16 },
  vazioContainer: { alignItems: 'center', paddingTop: 60 },
  vazioIcone: { fontSize: 48, marginBottom: 12 },
  vazioTexto: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  modalBotoes: { flexDirection: 'row', gap: 12 },
  modalCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelarTexto: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  modalConfirmar: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#0284C7',
    alignItems: 'center',
  },
  modalConfirmarTexto: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },

feedbackTitulo: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: 14,
},
feedbackPatologiaCard: {
  backgroundColor: '#EFF6FF',
  borderRadius: 10,
  padding: 12,
  marginBottom: 8,
},
feedbackPatologiaLabel: {
  fontSize: 11,
  fontWeight: '600',
  color: '#2563EB',
  textTransform: 'uppercase',
  marginBottom: 4,
},
feedbackPatologiaValor: {
  fontSize: 15,
  fontWeight: '700',
  color: '#1E40AF',
},
feedbackDiagnosticoCard: {
  backgroundColor: '#F3F4F6',
  borderRadius: 10,
  padding: 12,
  marginBottom: 8,
},
feedbackDiagnosticoLabel: {
  fontSize: 11,
  fontWeight: '600',
  color: '#6B7280',
  textTransform: 'uppercase',
  marginBottom: 4,
},
feedbackDiagnosticoValor: {
  fontSize: 14,
  color: '#374151',
},
feedbackTextoCard: {
  backgroundColor: '#F9FAFB',
  borderRadius: 10,
  padding: 14,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#E5E7EB',
},
feedbackTextoLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#374151',
  marginBottom: 8,
},
feedbackTexto: {
  fontSize: 14,
  color: '#374151',
  lineHeight: 22,
},
feedbackBotao: {
  backgroundColor: '#0284C7',
  borderRadius: 10,
  padding: 14,
  alignItems: 'center',
},
feedbackBotaoTexto: {
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: 15,
},
});