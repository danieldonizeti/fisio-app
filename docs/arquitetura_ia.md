# Arquitetura da integração com IA FisioApp

Este documento descreve como integrei modelo de linguagem (LLMs) ao backend Django: quais problemas a arquitetura resolve, como as camadas se organizam, quais decisões foram tomadas e por quê, e como tudo é testado e observado.

## Visão geral

O **FisioApp** é um aplicativo para estudantes de fisioterapia. O aluno conduz uma consulta simulada com um **paciente virtual** e, ao final, submete um **diagnóstico**, que é corrigido por um **avaliador** com feedback pedagógico.

A IA aparece em dois pontos:

| Função | O que faz | Saída |
| :--- | :--- | :--- |
| **Paciente virtual** | Responde como paciente com uma patologia secreta, no nível de dificuldade escolhido | Texto livre |
| **Avaliador de diagnóstico** | Compara o diagnóstico do aluno com a patologia real | Objeto estruturado e validado (veredito, análise, dica) |

**Stack:** Django REST Framework, autenticação JWT, app mobile em React Native. O provedor atual é a **OpenAI (Responses API)**, mas o núcleo da aplicação não depende dele: trocar de provedor significa escrever um novo adaptador.

### Princípios

1. **Desacoplamento:** a camada web não conhece SDKs de IA.
2. **Segurança:** a patologia secreta nunca sai do servidor antes da hora; entradas do usuário são tratadas como dados, não como instruções.
3. **Contexto controlado:** o custo e a latência de cada turno têm teto, e a coerência do paciente é preservada por um resumo clínico.
4. **Saídas estruturadas:** o que alimenta regras de negócio é validado por schema.
5. **Consistência:** uma conversa nunca fica com mensagem sem resposta, e duas chamadas simultâneas não se atropelam.
6. **Observabilidade:** falhas, latência e consumo de tokens são mensuráveis.

## Camadas

```text
[ React Native ]
       │  HTTPS + JWT
       ▼
[ View / Serializer (DRF) ]   autenticação, throttling, tradução de erros em HTTP
       │
       ▼
[ Casos de uso ]              StartSimulation · SendPatientMessage · EvaluateDiagnosis
       │
       ├──────────────► [ InteractionTracker ]   reserva por simulação + estado de cada chamada
       │
       ▼
[ Camada de IA ]
   ├─ ContextBuilder + ClinicalSummarizer     janela de contexto + resumo clínico
   ├─ Prompts + validação de entrada          instruções, delimitadores, neutralização
   └─ AIProvider (Protocol) ─► OpenAIProvider  único ponto que conhece o SDK
```

| Camada | Responsabilidade | Não faz |
| :--- | :--- | :--- |
| **View / Serializer** | Autenticação, throttling, validação de formato, converter exceções em respostas HTTP | Regras de negócio, chamadas de IA |
| **Casos de uso** | Orquestrar um fluxo completo ele valida, reserva, monta o contexto, chamar a IA, grava | Conhece o HTTP ou SDKs |
| **Camada de IA** | Contrato com o provedor, prompts, contexto e resumo | Conhecer o banco de dados da conversa |
| **Adaptador** | Traduzir o contrato interno para o SDK e os erros do SDK para erros internos | Regras de negócio |

### Estrutura de diretórios

```text
apps/consulta_ia/
├── models.py                    SimulacaoConsulta MensagemSimulacao  InteracaoIA
├── observability.py             formatador de log em JSON
├── serializers/
├── views/views.py               SimulacaoViewSet
├── application/
│   ├── dto.py                   mapeamento remetente
│   ├── interactions.py          InteractionTracker (reserva, estado, registro)
│   ├── metrics.py               cálculo das métricas
│   └── use_cases/
│       ├── start_simulation.py
│       ├── send_patient_message.py
│       └── evaluate_diagnosis.py
├── domain/
│   └── exceptions.py            hierarquia de erros internos
├── ai/
│   ├── contracts.py             AIProvider, StructuredAIProvider, AIRequest, AIResponse
│   ├── schemas.py               ClinicalSummary, DiagnosisEvaluation (Pydantic)
│   ├── prompts/                 avaliador de diagnóstico
│   ├── context/                 builder, token_budget, summarizer, factory
│   ├── security/                neutralização de delimitadores
│   └── providers/               openai_provider, factory
├── management/commands/         comando de métricas
└── tests/                       unit, integration, evaluation
```

## Contrato com o provedor

O núcleo conversa com a IA por um contrato mínimo, definido com `typing.Protocol`:

```python
class AIProvider(Protocol):
    def generate(self, request: AIRequest) -> AIResponse: ...

class StructuredAIProvider(AIProvider, Protocol):
    def generate_structured(self, request: AIRequest, schema: type[T]) -> AIStructuredResponse[T]: ...
```

- `AIRequest` e `AIResponse` são `dataclass(frozen=True)`; as mensagens são uma **tupla**, o que torna a imutabilidade real.
- O papel `system` **não existe** nas mensagens: as instruções vão em `AIRequest.instructions`. Assim o histórico não pode carregar uma instrução "de sistema" injetada.
- Quem só precisa de texto (paciente) depende de `AIProvider`; quem precisa de objeto validado (avaliador) depende de `StructuredAIProvider` (segregação de interfaces).
- O adaptador `OpenAIProvider` recebe o cliente por injeção (nos testes entra um falso), usa `store=False` para não reter as conversas no lado do provedor, e converte qualquer erro do SDK em `AIProviderError`, preservando a causa original (`raise ... from exc`).


Pontos importantes:

- A chamada de IA acontece **fora de qualquer transação**: ela pode levar dezenas de segundos e não pode segurar conexão nem trava de banco.
- A mensagem do aluno só é gravada **junto com a resposta**, na mesma transação. Se a IA falha, nada é gravado: a interação é marcada como `falhou` e a conversa continua consistente. O cliente pode simplesmente reenviar.
- Se o processo morrer no meio, a reserva **expira** (180 s por padrão) e a simulação é liberada.

## Fluxo: submeter o diagnóstico

1. Valida que a simulação está ativa e que o texto é válido (não vazio, até 300 caracteres).
2. Reserva a simulação (a mesma restrição que protege as mensagens).
3. Monta a requisição: a **patologia real vai nas instruções (papel de sistema)**; o diagnóstico do aluno e a transcrição vão em uma mensagem separada, dentro de tags de dados, com `<` neutralizado.
4. Chama `generate_structured` com o schema `DiagnosisEvaluation`.
5. Em **uma transação**: marca a simulação como finalizada e a interação como concluída.
6. Se qualquer passo falha, a simulação **continua ativa** e o aluno pode tentar de novo. Não existe resultado "de consolação" gerado por heurística.

A resposta mantém o campo `feedback` em texto (montado pelo servidor) e acrescenta `veredito`, `analise_clinica` e `dica_do_professor`. O veredito é um de `correto`, `proximo` ou `incorreto`.

## Gerenciamento de contexto

O histórico completo fica no banco, mas o modelo recebe só o necessário, em três camadas:

| Camada | Conteúdo | Onde vive |
| :--- | :--- | :--- |
| **Histórico completo** | Todas as mensagens | `MensagemSimulacao` |
| **Contexto recente** | Últimas mensagens, limitadas por quantidade e por orçamento de tokens | Montado a cada turno pelo `ContextBuilder` |
| **Resumo clínico** | Fatos que o paciente já declarou (lado, duração, intensidade etc.) | `SimulacaoConsulta.resumo_clinico` |

**Orçamento de tokens.** O `ContextBuilder` seleciona mensagens da mais recente para a mais antiga até estourar o limite. As instruções gastam orçamento; a última mensagem sempre entra. A contagem é uma **estimativa** (3 caracteres por token, mais um custo fixo por mensagem), propositalmente conservadora: no modelo em uso ela ficou cerca de 25% acima do consumo real.

**Resumo com histerese.** Quando a janela não comporta tudo o que veio depois do último resumo, o resumidor consolida tudo **exceto a metade mais recente da janela**. Assim as mensagens mais novas aparecem no resumo e na janela ao mesmo tempo (nunca há "buraco"), e o próximo resumo só é necessário depois de várias mensagens, em vez de a cada turno.

O resumo só registra fatos do **paciente**, é validado por schema (no máximo 25 fatos, chaves em `snake_case`, valores curtos) e, se falhar, o turno segue sem ele: a resposta ao aluno nunca quebra por causa do resumo.

## Controle de concorrência e estado

Cada chamada principal à IA gera um registro `InteracaoIA` com estado `processando`, `concluida` ou `falhou`, além de modelo, tokens e código de erro.

A regra "no máximo uma interação em andamento por simulação" é garantida por uma **restrição única parcial no banco**:

```python
UniqueConstraint(
    fields=["simulacao"],
    condition=Q(estado="processando"),
    name="uma_interacao_processando_por_simulacao",
)
```

Duas requisições simultâneas disputam a inserção; o banco deixa passar uma, e a outra recebe `409 interaction_in_progress`. Isso não depende de `select_for_update` (que o SQLite ignora) nem de estado em memória do processo. Além disso:

- A reserva tem **prazo de validade**: reservas antigas são marcadas como `falhou` (`lease_expired`) e deixam de bloquear.
- Ao reservar, o estado `ativa` da simulação é relido do banco, para que um objeto desatualizado em memória não permita um segundo diagnóstico.
- Mensagens e diagnóstico compartilham a mesma reserva: enviar mensagem durante a avaliação do diagnóstico também recebe 409.
- As chamadas auxiliares (resumo) são registradas como interações do tipo `resumo`, **sem** reserva, porque rodam dentro de uma interação principal.

## Contrato da API

Respostas de erro seguem sempre o formato `{"detail": "<mensagem pública>", "code": "<código estável>"}`. O texto de `detail` é seguro para exibir; o `code` é estável para a UI tratar casos específicos.

| Status | Código | Quando |
| :--- | :--- | :--- |
| 400 | `invalid_message` | Mensagem ausente, vazia ou não textual |
| 400 | `invalid_diagnosis` | Diagnóstico ausente, vazio ou não textual |
| 400 | `input_too_long` | Texto acima do limite configurado |
| 400 | `simulation_closed` | Simulação já finalizada |
| 401 | — | Sem token válido |
| 404 | — | Simulação inexistente ou de outro usuário |
| 409 | `interaction_in_progress` | Já existe uma resposta em andamento nesta simulação |
| 429 | — | Limite de requisições excedido (resposta padrão do DRF) |
| 500 | `ai_provider_error`, `ai_empty_response`, `ai_invalid_output`, `ai_unavailable` | Falha da IA ou do ambiente; sem detalhes internos |
| 503 | `no_pathology_available` | Não há patologia cadastrada para sortear |

Criação de simulação: `POST` com `titulo` e `nivel`. A patologia é sorteada no servidor e **não** aparece em nenhuma resposta da API; ela só é revelada na resposta de `submeter-diagnostico`.

## Segurança

| Ameaça | Defesa |
| :--- | :--- |
| Aluno lê ou altera a patologia secreta | Campo fora do serializer; sorteio no servidor; endpoint de sorteio removido |
| Aluno reabre uma simulação finalizada ou edita seu estado | `ativa`, `finalizado_em` e `criado_em` somente leitura; bloqueio de nova submissão |
| *Prompt injection* na mensagem ou no diagnóstico | Instruções em campo separado; entrada do usuário dentro de tags marcadas como dados; `<` neutralizado para impedir fechar a tag; critérios de veredito fixos; testes de avaliação com tentativas de injeção |
| Injeção persistida via resumo clínico | Resumo guarda só fatos declarados pelo paciente, validados por schema e com tamanho limitado (risco residual: ver seção 13) |
| Abuso de custo | Limite de caracteres, orçamento de tokens, *throttling* por escopo (mensagens e diagnóstico), reserva única por simulação |
| Vazamento de detalhes internos | Mensagem pública separada do detalhe; traceback só no log do servidor |
| Acesso a simulação de outro usuário | Queryset filtrado pelo usuário autenticado (404) |
| Vazamento de conteúdo nos logs | Logs levam apenas identificadores, tamanhos e códigos; há teste dedicado |

## Tratamento de erros

Todas as falhas conhecidas descendem de `ConsultaIAError`, que carrega:

- `code`: identificador estável, usado pela UI e pelas métricas;
- `public_message`: único texto que pode chegar ao cliente;
- o argumento `detail` (a mensagem da exceção): **interno**, só para logs.

A view traduz `ConsultaIAError` em resposta HTTP e trata qualquer outra exceção como erro genérico (registrando o traceback). O adaptador converte erros do SDK em `AIProviderError` e saídas fora do schema em `AIInvalidOutputError`.

## Observabilidade

- **Logs estruturados** em JSON (uma linha por interação): `interacao_id`, `simulacao_id`, `tipo`, `modelo`, `tokens_entrada`, `tokens_saida`, `duracao_ms`, `erro_codigo`.
- **Tabela `InteracaoIA`** como fonte de verdade das métricas, inclusive as chamadas de resumo.
- **Comando de métricas:**

```bash
python manage.py ia_metrics --dias 7
```

Mostra, por tipo (`mensagem`, `diagnostico`, `resumo`), o total, a taxa de falha, p50 e p95 de latência, tokens e os códigos de erro mais frequentes.
- **Admin** somente leitura para inspecionar interações.

O que acompanhar: p95 de latência próximo do timeout; qualquer ocorrência de `lease_expired`; crescimento de `tokens_entrada` por turno (deve estabilizar); falhas do tipo `resumo` (o turno continua, mas o paciente fica mais propenso a esquecer detalhes).

## Estratégia de testes

| Nível | Comando | O que prova | Chama a IA? |
| :--- | :--- | :--- | :--- |
| **Unitários e de API** | `pytest` | O código se comporta como projetado (fluxos, erros, isolamento, concorrência, segurança, logs) | Não (provedor falso) |
| **Integração** | `pytest -m integration` | O adaptador funciona contra a API real | Sim |
| **Avaliação clínica** | `pytest -m evaluation -v -s` | O **modelo** se comporta bem: paciente não revela a patologia, avaliador resiste a injeção e julga com coerência, resumo preserva fatos | Sim |

- Os testes padrão usam um provedor falso injetado; nenhum teste comum toca a rede ou gasta crédito.
- A suíte de avaliação executa cada cenário 3 vezes, com **zero tolerância** nos de segurança e tolerância parcial nos julgamentos subjetivos. Ela deve ser rodada antes de mudar um prompt ou trocar de modelo, e **não** faz parte da execução automática.
- Bugs conhecidos foram documentados com `xfail(strict=True)` antes de corrigidos: o teste vermelho esperado vira alarme quando o bug é resolvido.

## Configuração

| Variável | Padrão | Função |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | — | Chave da API |
| `OPENAI_MODEL` | — | Modelo usado (sem padrão: depende da conta) |
| `OPENAI_TIMEOUT_SECONDS` | 30 | Timeout da chamada |
| `OPENAI_SEND_TEMPERATURE` | true | Alguns modelos recusam o parâmetro `temperature` |
| `AI_CONTEXT_MAX_INPUT_TOKENS` | 3000 | Orçamento de entrada (instruções + contexto) |
| `AI_CONTEXT_MAX_MESSAGES` | 30 | Máximo de mensagens recentes enviadas |
| `AI_MAX_USER_MESSAGE_CHARS` | 1000 | Tamanho máximo da mensagem do aluno |
| `AI_MAX_DIAGNOSIS_CHARS` | 300 | Tamanho máximo do diagnóstico |
| `AI_INTERACTION_LEASE_SECONDS` | 180 | Validade da reserva de uma interação |

O *throttling* é configurado em `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES` (padrão: 20/min para mensagens e 5/min para diagnóstico).

## Limitações conhecidas e evolução

- **Processamento síncrono.** O turno que gera um resumo faz duas chamadas de IA em sequência e fica mais lento. Mover o resumo para uma tarefa em segundo plano é possível; nesse caso entra o estado `pendente`.
- **Throttling depende do cache.** O cache padrão é local a cada processo; em produção com vários processos é preciso um cache compartilhado (por exemplo, Redis).
- **Restrição única parcial** exige banco com suporte (SQLite e PostgreSQL funcionam; MySQL não).
- **Estimativa de tokens aproximada.** Pode ser calibrada com a relação entre `tokens_entrada` registrado e a estimativa logada.
- **Resumo é um canal sensível.** Ele é validado e restrito a fatos do paciente, mas continua sendo texto gerado por modelo que reentra nas instruções; os testes de avaliação monitoram isso, sem garantia absoluta.
- **Transcrição inteira no avaliador.** Conversas muito longas aumentam o custo da avaliação; um limite de mensagens por simulação seria uma evolução natural.
- **A suíte de avaliação mede, não garante.** Três repetições por cenário reduzem a variação, mas não eliminam; casos novos devem ser acrescentados sempre que um comportamento indesejado for encontrado.