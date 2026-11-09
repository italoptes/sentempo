# Estudo A — ESTUDO_A_V2

## Desenho aprovado

Cada participante tem uma sessão por versão: três blocos, um por condição
(`SEM_ESTIMULO`, `LENTO`, `RAPIDO`). Cada bloco contém uma tentativa de cada
tempo-alvo (5000, 10000, 15000 ms), em ordem sorteada e persistida. São 9
resultados concluídos. As seis permutações das condições são atribuídas em ciclo
por contador transacional no banco; a diferença de alocações é de no máximo um
na ausência de exclusões administrativas. Retomadas não consomem outra sequência.

A proposta acadêmica sugeria 36 tentativas com uma quarta condição acelerada.
Ela foi removida para reduzir duração e complexidade e concentrar a comparação
em ritmos constantes e silêncio. Não há treinamento nesta versão. Estudo B está
fora do escopo. O fluxo antigo e o modo livre não integram a coleta.

Em 09/11/2026, o escopo foi reduzido de três repetições por combinação (27
tentativas, ESTUDO_A_V1) para uma (9 tentativas, ESTUDO_A_V2). V1 permanece
como histórico de consulta e exportação, sem apagar ou truncar posições,
respostas ou resultados. A entrada do participante cria/retoma apenas V2.
Não reutilizamos consentimento ou resultados de V1 para preencher V2.
O contador de contrabalanceamento é independente para cada versão.

## Participação

Explicação neutra e consentimento → dispositivo/fones → teste de áudio e volume
confortável → instruções → três blocos de três tentativas → encerramento.
Orientar a estimar sem contar segundos ou bipes. Não revelar hipóteses.

O participante conhece o alvo antes de iniciar. A tela ativa é visualmente igual
nas três condições, com botão Finalizar estável e sem animação rítmica, relógio,
barra temporal ou resultados. Silêncio não reproduz áudio. Lento e rápido usam o
mesmo bip, duração e volume, com intervalos fixos de 1000 e 500 ms; primeiro bip
no início efetivo. A preparação iniciada por gesto fica fora da medição.

Ao concluir um bloco, o participante descansa e escolhe Continuar. Não há tempo
mínimo, contagem regressiva ou avanço automático. Após o terceiro bloco, encerrar.

Troca de aba, saída ou falha de áudio cancela a medição e libera recursos. Não
salvar resultado parcial nem avançar. Recomeçar a mesma posição. Após fechamento,
a posição pendente permanece. Se houver perda de confirmação após Finalizar,
consultar o servidor antes de permitir nova execução. Uma posição só aceita um
resultado, inclusive em duas abas; o banco e a API protegem essa regra.

## Dados e métricas

Persistir versão, sequência atribuída, blocos, ordem, repetição, consentimento,
categoria de dispositivo, uso declarado de fones e volume configurado. O volume
é relativo ao sintetizador; não constitui calibração física em decibéis.
O cliente mede com performance.now(); o servidor calcula e armazena resultado,
erro assinado e absoluto em ms (três casas), e erro relativo percentual.

Erro assinado = resultado − alvo; erro absoluto = abs(erro);
erro relativo (%) = 100 × (resultado − alvo) / alvo.
Parada antecipada é compatível com superestimação da duração transcorrida;
parada tardia, com subestimação. Não inferir medida direta de atenção ou
concentração, nem comprovação automática de efeito de nudge.

Resultados numéricos só são disponibilizados ao participante ao concluir as 9
tentativas. Administração e exportação identificam explicitamente protocolo
anterior, Estudo A e modo livre; a exportação usa UUID do participante como
pseudônimo, sem nome nem código de acesso de quatro dígitos.

## Questionário aprovado

O usuário aprovou o conteúdo antes da implementação. Após cada tentativa:
“Quão confiante você está de que finalizou próximo do tempo-alvo?”, escala 1
(Nada confiante) a 7 (Muito confiante). Após cada bloco, antes da pausa ou
encerramento: “Quão agradável foi realizar este bloco?”, 1 (Muito desagradável)
a 7 (Muito agradável), e “Quanta ansiedade você sentiu durante este bloco?”,
1 (Nenhuma) a 7 (Muita). Ao final: “Qual estratégia você utilizou na maior parte
das tentativas?”: Estimei sem contar, Contei mentalmente, Usei os bipes para
contar, Combinei estratégias ou Outra; comentário opcional até 300 caracteres.

Todas oferecem “Prefiro não responder”, registrado como NULL com um marco de
preenchimento, nunca zero. Uma etapa pendente é retomada antes da próxima
tentativa/pausa. O questionário não revela duração nem erro. Não incluímos
esforço ou rapidez percebida para limitar a fadiga. Executar piloto antes da
coleta real. A sessão encerra após o questionário final (inclusive se pulado).

## Preservação e operação

Migrações aditivas criam sessões e tentativas planejadas em tabelas próprias,
sem converter ou apagar resultados anteriores de 30 segundos. As restrições de
unicidade anteriores continuam válidas para o protocolo antigo. Novas posições
são únicas por sessão; há uma tentativa por combinação na V2, com `repeticao=1`.
A migração `0005_estudo_a_nove` preserva o tamanho dos blocos antigos (9),
permite os novos blocos de 3 e mantém as restrições de duplicidade. A informação
`tamanho_bloco` de cada posição determina os limites de ordem e repetição. O
downgrade é recusado enquanto houver sessões V2, evitando uma conversão inválida.

Exclusões existentes exigem JWT administrativo. Exclusão individual verifica
participante e tentativa simultaneamente. Não oferecer exclusão de resultados
oficiais ao participante. Não prometer coleta offline ou sincronização posterior.

## Verificação

Testar composição, distribuição das ordens, concorrência, retomada, pausas,
duplicidade, métricas, separação de dados, autorização e migração com dados
antigos. Índices, locks e migrações devem ser verificados também em PostgreSQL.

## API e retomada

Prefixo `/api/participantes/{participante_id}/estudo-a`:

- GET: sessão V2 ou null quando não existe, mesmo que haja sessão histórica V1.
- POST: criar V2 após consentimento e áudio testado, ou retomar a V2 existente.
  Corpo: `consentimento: true`, `audio_testado: true`, `dispositivo` (COMPUTADOR,
  CELULAR, TABLET, OUTRO), `usa_fones` booleano, `volume` entre 0.1 e 1.
- POST `/tentativas/{tentativa_id}`: `resultado_ms`, sem métricas do cliente.
- POST `/questionario`: tipo TENTATIVA/BLOCO/FINAL e respostas correspondentes.
- POST `/continuar`: libera o próximo bloco após suas perguntas e a pausa livre.

Situacoes: EM_ANDAMENTO, QUESTIONARIO_TENTATIVA, QUESTIONARIO_BLOCO, INTERVALO,
QUESTIONARIO_FINAL, CONCLUIDA. Resultados são ocultados até CONCLUIDA. Não há
endpoint de exclusão de posição do novo estudo. Sessão por participante/versão
evita recomeçar a coleta inteira ou consumir uma nova ordem ao retomar.

Administração autenticada: GET `/api/administracao/estudo-a?pagina=1&tamanho=10&versao=ESTUDO_A_V2`
retorna resumo, médias por condição/tempo e sessões com plano e respostas. A
paginação aceita até 100 sessões. As estatísticas incluem tentativas confirmadas
de sessões em andamento e completas, informando isso no painel. O filtro
`versao` aceita ESTUDO_A_V2 (padrão) ou ESTUDO_A_V1 (histórico). Não mistura
sessões com 9 e 27 tentativas nas mesmas estatísticas.

CSV: GET `/api/administracao/exportacao.csv?origem=ESTUDO_A&versao=ESTUDO_A_V2`, ou origem ANTERIOR
(padrão de compatibilidade) e LIVRE. Cada arquivo tem apenas uma origem; o
cabeçalho identifica a versão. ESTUDO_A exporta apenas a versão selecionada
(V2 por padrão); V1 pode ser exportada explicitamente. Não exporta nomes nem códigos de acesso. Os
endpoints antigos de resumo e estatísticas continuam restritos ao protocolo
anterior, explicitamente identificado na interface.

## Dicionário da base de análise

CSV usa UTF-8 com BOM, separador `;` e ponto decimal. Campos vazios representam
ausência, não zero. Comentários começando como fórmula de planilha recebem um
apóstrofo de proteção somente na exportação; o banco mantém o texto original.

| Colunas | Significado |
| --- | --- |
| codigo_participante | UUID estável, pseudônimo; diferente do código de acesso |
| origem, versao_protocolo | Separação entre ANTERIOR, ESTUDO_A e LIVRE |
| sessao_id, sequencia | UUID da sessão e índice de permutação 0–5 |
| condicao, tempo_alvo_ms | Condição e alvo em milissegundos |
| bloco, ordem, repeticao | V2: bloco 1–3, ordem 1–9, repetição sempre 1; V1 histórica: ordem 1–27 e repetição 1–3 |
| resultado_ms, erro_ms, erro_absoluto_ms | Valores em ms, três casas decimais |
| erro_relativo_percentual | Erro assinado dividido pelo alvo, vezes 100 |
| concluida_em | Momento UTC de confirmação da medição |
| dispositivo, usa_fones, volume | Contexto declarado e volume relativo configurado |
| consentido_em, sessao_concluida_em | Início consentido e encerramento após questionário |
| confianca, confianca_respondida_em | Escala 1–7 e marco de resposta ou recusa |
| agradabilidade, ansiedade, bloco_respondido_em | Escalas 1–7 do bloco, repetidas em suas linhas |
| estrategia, comentario | Resposta final e texto opcional |

Quando `*_respondida_em`/`bloco_respondido_em` está preenchido e a resposta está
vazia, a pessoa escolheu não responder. Sem marco, a pergunta está pendente.
Estratégia vazia com sessão encerrada também significa recusa.

## Comandos de validação

Backend com Python 3.12 e dependências de `requirements-dev.txt`:

```bash
cd backend
pytest -v
BANCO_TESTES_POSTGRES=postgresql+psycopg://usuario:senha@localhost:5432/banco_exclusivo_testes pytest -v
```

**BANCO_TESTES_POSTGRES deve apontar exclusivamente para um banco descartável.**
A suíte cria e remove tabelas; o teste de migração usa ainda um schema temporário.
Não usar a URL do banco real. O CI provisiona PostgreSQL independente para isso.

```bash
cd frontend
npm ci
npm test
npm run lint
npm run build
```

Para disponibilizar localmente, aplicar `alembic upgrade head` antes de iniciar
a API. A migração não é aplicada no banco real durante os testes. O Compose já
executa migrações no script de inicialização do backend.
