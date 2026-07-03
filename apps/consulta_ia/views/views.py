from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from apps.patologias.models import Patologia
from google import genai
from google.genai import types
import random
import os

from ..models import SimulacaoConsulta, MensagemSimulacao
from ..serializers.consulta_ia_serializer import SimulacaoSerializer, MensagemSerializer
from ..prompts import get_prompt


class SimulacaoViewSet(viewsets.ModelViewSet):
    serializer_class = SimulacaoSerializer

    def get_queryset(self):
        return SimulacaoConsulta.objects.filter(fisioterapeuta=self.request.user)

    def perform_create(self, serializer):
        serializer.save(fisioterapeuta=self.request.user)

    @action(detail=False, methods=['get'], url_path='patologia-aleatoria')
    def patologia_aleatoria(self, request):
        patologias = Patologia.objects.all()
        if not patologias.exists():
            return Response(
                {'detail': 'Nenhuma patologia cadastrada.'},
                status=status.HTTP_404_NOT_FOUND
            )
        patologia = random.choice(patologias)
        return Response({
            'id': patologia.id,
            'nome': patologia.nome,
            'regiao': patologia.get_regiao_display(),
        })

    @action(detail=True, methods=['post'], url_path='enviar-mensagem')
    def enviar_mensagem(self, request, pk=None):
        simulacao = self.get_object()

        if not simulacao.ativa:
            return Response(
                {'detail': 'Esta simulação já foi finalizada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        mensagem_fisio = request.data.get('mensagem', '').strip()
        if not mensagem_fisio:
            return Response(
                {'detail': 'Mensagem não pode ser vazia.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        MensagemSimulacao.objects.create(
            simulacao=simulacao,
            remetente='fisio',
            conteudo=mensagem_fisio
        )

        historico = simulacao.mensagens.all()
        contents = []
        for msg in historico:
            role = 'user' if msg.remetente == 'fisio' else 'model'
            contents.append({
                'role': role,
                'parts': [{'text': msg.conteudo}],
            })

        api_key = os.environ.get('GEMINI_API_KEY', '')
        if not api_key:
            return Response(
                {'detail': 'Chave da API Gemini não configurada.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=get_prompt(simulacao.nivel, simulacao.patologia_simulada),
                    max_output_tokens=300,
                    temperature=0.8,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            resposta_ia = (response.text or '').strip()

            if not resposta_ia:
                return Response(
                    {'detail': 'A IA não retornou uma resposta.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            return Response(
                {'detail': f'Erro ao contatar IA: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        MensagemSimulacao.objects.create(
            simulacao=simulacao,
            remetente='paciente',
            conteudo=resposta_ia
        )

        return Response({
            'remetente': 'paciente',
            'conteudo': resposta_ia,
        })

    @action(detail=True, methods=['post'], url_path='submeter-diagnostico')
    def submeter_diagnostico(self, request, pk=None):
        simulacao = self.get_object()
        diagnostico = request.data.get('diagnostico', '').strip()

        if not diagnostico:
            return Response(
                {'detail': 'Informe o diagnóstico.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        historico = simulacao.mensagens.all()
        resumo_consulta = '\n'.join([
            f"{'Fisioterapeuta' if msg.remetente == 'fisio' else 'Paciente'}: {msg.conteudo}"
            for msg in historico
        ])

        prompt_avaliacao = f"""Você é um professor especialista em fisioterapia avaliando o raciocínio clínico de um estudante.

PATOLOGIA REAL DO CASO: {simulacao.patologia_simulada}
DIAGNÓSTICO SUBMETIDO PELO ESTUDANTE: {diagnostico}

TRANSCRIÇÃO DA CONSULTA:
{resumo_consulta}

Gere um feedback direto, pedagógico e objetivo para o estudante seguindo estritamente a estrutura abaixo:

1. **Resultado**: Diga claramente se ele acertou, errou ou ficou próximo do diagnóstico real.
2. **Análise Clínica**: Destaque o que ele identificou corretamente e o que ele deixou passar ou se equivocou (corrija termos técnicos ou uso de linguagem informal se necessário).
3. **Dica do Professor**: Forneça uma dica clínica valiosa e prática sobre essa patologia específica.

Regras de formatação:
- Seja direto e conciso. Cada um dos 3 tópicos deve conter no máximo duas frases.
- Escreva em português brasileiro.
- Nunca deixe frases cortadas ou incompletas. Termine sempre com ponto final."""
        
        try:
            api_key = os.environ.get('GEMINI_API_KEY', '')
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[{
                    'role': 'user',
                    'parts': [{'text': prompt_avaliacao}],
                }],
                config=types.GenerateContentConfig(
                    max_output_tokens=1024,
                    temperature=0.7,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            feedback_ia = (response.text or '').strip()

        except Exception as e:
            # Fallback simples se a IA falhar
            patologia_real = simulacao.patologia_simulada.lower()
            diagnostico_lower = diagnostico.lower()
            palavras_ignorar = ['de', 'do', 'da', 'dos', 'das', 'e', 'o', 'a']
            palavras_diagnostico = [p for p in diagnostico_lower.split() if p not in palavras_ignorar]
            palavras_patologia = [p for p in patologia_real.split() if p not in palavras_ignorar]
            coincidencias = sum(1 for p in palavras_diagnostico if any(p in pp or pp in p for pp in palavras_patologia))
            acertou = coincidencias >= max(1, len(palavras_patologia) // 2)
            feedback_ia = '🎉 Diagnóstico correto!' if acertou else f'❌ A patologia era: {simulacao.patologia_simulada}'

        simulacao.ativa = False
        simulacao.finalizado_em = timezone.now()
        simulacao.save()

        return Response({
            'patologia_real': simulacao.patologia_simulada,
            'diagnostico_submetido': diagnostico,
            'feedback': feedback_ia,
        })

    @action(detail=True, methods=['post'], url_path='finalizar')
    def finalizar(self, request, pk=None):
        simulacao = self.get_object()
        simulacao.ativa = False
        simulacao.finalizado_em = timezone.now()
        simulacao.save()
        return Response({'detail': 'Simulação finalizada com sucesso.'})

    @action(detail=True, methods=['get'], url_path='historico')
    def historico(self, request, pk=None):
        simulacao = self.get_object()
        mensagens = simulacao.mensagens.all()
        return Response(MensagemSerializer(mensagens, many=True).data)