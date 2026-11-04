# Estudo A — ESTUDO_A_V1

## Desenho aprovado

Cada participante tem uma sessão por versão: três blocos, um por condição
(`SEM_ESTIMULO`, `LENTO`, `RAPIDO`). Cada bloco contém três tentativas de cada
tempo-alvo (5000, 10000, 15000 ms), em ordem sorteada e persistida. São 27
resultados concluídos. As seis permutações das condições são atribuídas em ciclo
por contador transacional no banco; a diferença de alocações é de no máximo um
na ausência de exclusões administrativas. Retomadas não consomem outra sequência.

A proposta acadêmica sugeria 36 tentativas com uma quarta condição acelerada.
Ela foi removida para reduzir duração e complexidade e concentrar a comparação
em ritmos constantes e silêncio. Não há treinamento nesta versão. Estudo B está
fora do escopo. O fluxo antigo e o modo livre não integram a coleta.

## Participação

Explicação neutra e consentimento → dispositivo/fones → teste de áudio e volume
confortável → instruções → três blocos de nove tentativas → encerramento.
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

Resultados numéricos só são disponibilizados ao participante ao concluir as 27
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
são únicas por sessão; há três repetições por combinação.

Exclusões existentes exigem JWT administrativo. Exclusão individual verifica
participante e tentativa simultaneamente. Não oferecer exclusão de resultados
oficiais ao participante. Não prometer coleta offline ou sincronização posterior.

## Verificação

Testar composição, distribuição das ordens, concorrência, retomada, pausas,
duplicidade, métricas, separação de dados, autorização e migração com dados
antigos. Índices, locks e migrações devem ser verificados também em PostgreSQL.
