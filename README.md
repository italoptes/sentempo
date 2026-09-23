# Experimento de Percepção Temporal com Nudges Audiovisuais

Sistema acadêmico para a disciplina de Interface com Usuário. O sistema executa um experimento de percepção temporal: a pessoa tenta indicar quando acredita que um tempo-alvo terminou, sob diferentes condições de estímulo audiovisual.

Este documento é a especificação principal do projeto. As regras aqui descritas devem ser implementadas integralmente; não criar comportamentos alternativos sem atualizar este arquivo.

## 1. Objetivo

Investigar como estímulos audiovisuais periódicos influenciam a percepção de duração em três tempos-alvo:

| Tempo-alvo | Valor armazenado |
| --- | ---: |
| Curto | 5 segundos / `5000` ms |
| Médio | 15 segundos / `15000` ms |
| Longo | 30 segundos / `30000` ms |

Cada participante pode realizar uma tentativa para cada combinação de tempo e condição, totalizando no máximo 9 tentativas.

| Condição | Código | Estímulo |
| --- | --- | --- |
| Sem estímulo | `SEM_ESTIMULO` | Sem círculo pulsante e sem som |
| Rápido | `RAPIDO` | Pulso audiovisual a intervalos aleatórios entre 300 e 700 ms |
| Lento | `LENTO` | Pulso audiovisual a intervalos aleatórios entre 900 e 1600 ms |

Não há música, cronômetro, contagem regressiva, barra de progresso ou indicação visual do tempo restante durante uma rodada.

## 2. Escopo e decisões obrigatórias

- Frontend: React, TypeScript, Vite e Tailwind CSS.
- Áudio: Tone.js.
- Animações: usar a biblioteca Motion for React para o controle do efeito visual.
- Backend: Python, FastAPI, SQLAlchemy e Pydantic.
- Banco: PostgreSQL.
- Execução e entrega: Docker e Docker Compose.
- Proxy reverso para produção: Nginx (o desenvolvimento local pode acessar a API diretamente).
- Todo identificador de domínio deve estar em português: arquivos, classes, funções, variáveis, rotas, DTOs, tabelas e colunas. Nomes de dependências, comandos e APIs externas mantêm seus nomes originais quando necessário.
- A aplicação deve ser responsiva e utilizável em desktop e celular. O experimento deve informar que fones de ouvido são recomendados, mas não deve exigir a detecção deles.

## 3. Identidade visual — Sentempo

O nome visual do sistema é **Sentempo**. A identidade deve transmitir tecnologia, calma, precisão e percepção, sem aparência excessivamente futurista ou de jogo.

### 3.1 Paleta de cores

| Uso | Nome | Cor |
| --- | --- | --- |
| Principal | Verde-petróleo | `#0F2D2E` |
| Destaque | Turquesa | `#00C2A8` |
| Destaque claro | Menta | `#BDE8E0` |
| Fundo | Off-white | `#F7F8F7` |
| Texto secundário | Cinza-azulado | `#6B7280` |
| Branco | Branco | `#FFFFFF` |

Combinação principal: `#0F2D2E` + `#00C2A8` + `#F7F8F7`.

Aplicação sugerida:

- `#0F2D2E`: cabeçalho, títulos principais, texto de alta ênfase e fundos escuros institucionais;
- `#00C2A8`: botões principais, foco, seleção ativa, indicadores e elementos interativos;
- `#BDE8E0`: fundos de cartões informativos, estados suaves, destaques secundários e áreas de apoio;
- `#F7F8F7`: fundo principal das páginas;
- `#6B7280`: textos secundários, descrições, rótulos auxiliares e metadados;
- `#FFFFFF`: cartões, campos e conteúdo sobre fundo escuro.

As cores devem ser declaradas como tokens no Tailwind e, se necessário, também como variáveis CSS. Evitar valores hexadecimais espalhados pelos componentes.

```ts
cores: {
  principal: "#0F2D2E",
  destaque: "#00C2A8",
  "destaque-claro": "#BDE8E0",
  fundo: "#F7F8F7",
  "texto-secundario": "#6B7280",
  branco: "#FFFFFF"
}
```

Estados de erro, alerta e sucesso podem usar cores auxiliares acessíveis, pois não estão definidas na paleta principal. Essas cores devem aparecer apenas em mensagens de estado e sempre acompanhadas de texto ou ícone.

### 3.2 Tipografia

A família tipográfica principal é **Poppins**.

| Peso | Aplicação |
| --- | --- |
| Poppins SemiBold (`600`) | Logo, títulos de página e títulos principais |
| Poppins Medium (`500`) | Subtítulos e elementos de destaque |
| Poppins Regular (`400`) | Textos, botões, campos e informações |

Referência de hierarquia:

- `Sentempo`: Poppins SemiBold;
- `SINTA O TEMPO`: Poppins Medium;
- `Escolha seu desafio`: Poppins Regular.

Carregar Poppins de maneira consistente em toda a aplicação. Para produção, preferir arquivos locais em `woff2` ou importação otimizada durante o build. Definir uma pilha de fallback, por exemplo `Poppins, system-ui, sans-serif`, para que a aplicação continue legível se a fonte não carregar.

### 3.3 Imagens e marca

- Os arquivos oficiais da identidade visual devem ficar no diretório `/images` da raiz do repositório.
- `images/logo_principal.png`: assinatura horizontal completa, com símbolo do cronômetro, nome **Sentempo** e slogan **SINTA O TEMPO**. Usar na tela de entrada, no cabeçalho institucional e em espaços horizontais com largura suficiente.
- `images/icone_sentempo.png`: ícone quadrado com o símbolo do cronômetro. Usar como favicon, ícone da aplicação, avatar da marca e em espaços compactos.
- O Codex deve reutilizar esses arquivos; não redesenhar, gerar ou substituir logotipo, símbolo ou assinatura visual sem solicitação explícita.
- Durante a implementação do frontend, copiar ou disponibilizar os arquivos necessários em `frontend/public/images`, preservando o arquivo original em `/images`.
- Referenciar assets públicos como `/images/nome-do-arquivo.ext` no frontend.
- Preservar proporção, transparência, resolução e área de respiro da marca.
- Não distorcer, girar, aplicar sombras fortes, recolorir ou adicionar efeitos ao logotipo.
- Usar texto alternativo descritivo quando a imagem comunicar conteúdo. Para imagens puramente decorativas, usar `alt=""`.
- Se existirem versões clara e escura, usar a versão com contraste apropriado ao fundo. Não aplicar filtros CSS para criar versões alternativas.
- A versão atual de `logo_principal.png` possui fundo transparente e dimensões de `1774 × 887` pixels.
- A versão atual de `icone_sentempo.png` possui fundo transparente, composição quadrada e dimensões de `1254 × 1254` pixels.
- O logo horizontal não deve ser usado em tamanho tão pequeno que o slogan fique ilegível; nessa situação, usar `icone_sentempo.png`.

### 3.4 Direção de interface

- Visual limpo, calmo e tecnológico, com formas simples e bastante espaço em branco.
- Cartões claros sobre fundo off-white, bordas discretas e cantos moderadamente arredondados.
- Botão principal em turquesa, com texto em verde-petróleo quando o contraste atender à WCAG; caso contrário, usar a combinação de maior contraste validada.
- Cabeçalhos e títulos em verde-petróleo.
- Evitar gradientes intensos, efeitos neon, excesso de brilho e estética futurista exagerada.
- O círculo do estímulo deve seguir a identidade visual, preferencialmente usando turquesa e menta, sem introduzir cores que alterem a neutralidade do experimento.
- Estados concluídos, selecionados e indisponíveis devem ser distinguíveis também por texto, ícone, borda ou padrão, e não apenas pela cor.
- Garantir contraste mínimo WCAG AA, foco visível, navegação por teclado e tamanho de toque adequado.

## 4. Conceitos e regras de negócio

### 4.1 Participante

- O acesso do participante é feito por `nome` e `codigo` de quatro dígitos.
- Nomes repetidos são permitidos.
- O código é uma string numérica entre `0000` e `9999`; zeros à esquerda são obrigatoriamente preservados.
- A busca do nome não diferencia maiúsculas e minúsculas. Antes de persistir e consultar, remover espaços nas extremidades e normalizar o nome para uma chave de comparação em minúsculas.
- O par `(nome_normalizado, codigo)` identifica o perfil. Se já existir, o sistema retoma esse participante e seu progresso; se não existir, cria-o.
- Não há senha, e-mail, recuperação de conta ou cadastro de dados sensíveis.

### 4.2 Tentativa

- Uma tentativa corresponde a exatamente uma combinação de `tempo_alvo_ms` e `condicao`.
- As nove combinações possíveis são: 3 tempos × 3 condições.
- Uma combinação já concluída não pode ser iniciada nem salva novamente para o mesmo participante.
- Uma tentativa só é válida quando o estímulo, caso aplicável, iniciou e funcionou durante a rodada. Se o áudio falhar, for bloqueado pelo navegador, não iniciar ou apresentar erro de reprodução, a rodada é cancelada e não é salva.
- Quando o participante clicar em iniciar, o frontend inicia a medição com `performance.now()`.
- Quando ele clicar em “Finalizar”, o frontend calcula `resultado_ms = performance.now() - instante_inicio` e envia o valor em milissegundos. Não arredondar antes do envio.
- O backend valida todos os valores e calcula novamente as métricas. O frontend pode mostrar essas métricas depois no menu, mas o banco considera a versão calculada pelo backend como fonte de verdade.
- Não deve existir um limite mínimo ou máximo artificial para o clique de finalizar. O backend apenas rejeita durações inválidas, não finitas ou não positivas.

### 4.3 Métricas

Para cada tentativa válida:

```text
erro_ms = resultado_ms - tempo_alvo_ms
erro_absoluto_ms = abs(erro_ms)
```

- `erro_ms < 0`: a pessoa finalizou abaixo do tempo-alvo.
- `erro_ms > 0`: a pessoa finalizou acima do tempo-alvo.
- `erro_ms = 0`: coincidência exata.
- Exibir duração e métricas ao participante somente no menu, depois da rodada concluída. Nunca exibir imediatamente após o clique de finalizar.
- Médias administrativas devem ser calculadas sobre tentativas válidas apenas.
- Para tendência, contabilizar `abaixo`, `acima` e `igual`, usando o sinal de `erro_ms`. A tendência predominante é a maior contagem; em empate, informar `Empate`.

### 4.4 Estados

Uma combinação pode estar em um destes estados de interface:

| Estado | Significado |
| --- | --- |
| `DISPONIVEL` | Ainda não há tentativa válida para a combinação |
| `EM_ANDAMENTO` | Rodada aberta localmente; não persistir este estado no banco |
| `CONCLUIDA` | Tentativa válida salva |
| `INDISPONIVEL` | Combinação concluída; botão desabilitado |

Não persistir tentativas incompletas, abortadas, com erro de áudio ou fechadas no meio. Ao reabrir a aplicação, apenas tentativas concluídas contam como progresso.

## 5. Fluxos de interface

### 5.1 Entrada

Rota sugerida: `/`.

1. Exibir título, explicação curta do experimento e aviso de uso de som.
2. Solicitar nome e código de quatro dígitos.
3. Validar nome não vazio e código exatamente com quatro caracteres numéricos.
4. Ao confirmar, criar ou recuperar o participante e navegar para `/inicio`.
5. Oferecer link discreto para a área administrativa (`/administracao`), separado do fluxo do participante.

### 5.2 Menu do participante

Rota sugerida: `/inicio`.

Deve apresentar:

- saudação com o nome do participante;
- progresso textual, como `4 de 9 tentativas concluídas`;
- grade ou cartões dos três tempos;
- para cada tempo, as três condições com estado disponível/concluída;
- tabela de resultados já salvos contendo tempo-alvo, condição, resultado, erro e erro absoluto;
- ação para sair do perfil local (limpa apenas a sessão do navegador, não os dados do banco).

Fluxo obrigatório: escolher **primeiro o tempo**, depois a condição. A interface deve impedir selecionar uma condição sem um tempo selecionado. Ao escolher uma combinação disponível, navegar para `/experimento/:tempo/:condicao`.

### 5.3 Preparação da rodada

Rota sugerida: `/experimento/:tempo/:condicao`.

Antes de iniciar, exibir:

- tempo escolhido e condição escolhida;
- instrução: “Quando você acreditar que o tempo terminou, toque em Finalizar.”;
- para condições com estímulo, aviso de que haverá pulsos visuais e sons curtos; para sem estímulo, informar que não haverá pulso;
- botão `Iniciar rodada`;
- botão `Voltar ao menu`.

Para condições `RAPIDO` e `LENTO`, só habilitar a rodada após Tone.js estar pronto e o contexto de áudio ser iniciado a partir do gesto do botão. Se não puder iniciar, mostrar erro claro e não iniciar o cronômetro.

### 5.4 Rodada ativa

Após o clique em `Iniciar rodada`:

- iniciar `performance.now()` e marcar a tela como ativa;
- esconder preparações e qualquer informação temporal;
- mostrar apenas o estímulo visual quando aplicável e um botão grande `Finalizar`;
- em `SEM_ESTIMULO`, não mostrar elemento que pulse ou marque ritmo; o botão deve permanecer estável;
- impedir clique duplo em finalizar;
- não oferecer voltar, reiniciar ou cancelar durante a rodada; fechar a página equivale a abandonar, sem salvar;
- ao finalizar, parar imediatamente agendamentos de áudio e animação, calcular o resultado e enviá-lo.

Após o salvamento bem-sucedido, navegar diretamente para o menu. Não criar tela de resultado instantâneo nem toast com a duração medida.

Se a API recusar por duplicidade, buscar o progresso atualizado e retornar ao menu com aviso de que a combinação já havia sido concluída. Se houver falha de rede após o clique, informar que o resultado não foi confirmado e permitir retornar ao menu; não reenviar automaticamente uma tentativa sem consultar antes o estado da combinação.

### 5.5 Administração

Rota sugerida: `/administracao`.

1. Solicitar nome e código administrativo configurados no ambiente.
2. Enviar autenticação para a API e guardar token apenas em memória ou `sessionStorage`, nunca em `localStorage`.
3. Mostrar dashboard somente de consulta e exportação. Não implementar criação, edição ou exclusão de participantes/tentativas.
4. Oferecer sair, removendo o token local.

## 6. Estímulo audiovisual

### 6.1 Requisitos perceptivos

- Estímulo visual sugerido: círculo central que aumenta levemente de tamanho e brilho e retorna ao estado original a cada pulso.
- O estímulo não deve exibir números, tempo, texto rítmico, barras ou contadores.
- Som: pulso muito curto, neutro, sem melodia, sem voz e sem música. Usar oscilador/sintetizador simples do Tone.js, com envelope curto e volume moderado e configurável.
- O som e o início da animação de cada pulso devem ser disparados pelo mesmo evento de agenda, buscando sincronização perceptiva.
- Respeitar `prefers-reduced-motion`: reduzir a amplitude visual, mas manter um sinal visual discreto. Não substituir por indicador temporal textual.
- Não usar cores como única forma de transmitir estado; utilizar texto, ícones ou contraste complementar.

### 6.2 Intervalos aleatórios

Em cada pulso, gerar o próximo intervalo de forma independente e uniforme inclusiva:

```text
RAPIDO: inteiro aleatório entre 300 e 700 ms
LENTO:  inteiro aleatório entre 900 e 1600 ms
```

O primeiro pulso deve ocorrer imediatamente ou após um intervalo sorteado, mas a escolha deve ser única e documentada no código. Adotar **primeiro pulso imediato** para confirmar que o áudio está ativo antes da rodada; os pulsos seguintes usam os intervalos sorteados.

Implementação sugerida:

1. No gesto de `Iniciar rodada`, chamar `Tone.start()` e criar/preparar o sintetizador.
2. Disparar o primeiro pulso audiovisual.
3. Registrar o início com `performance.now()` imediatamente após a preparação bem-sucedida e antes do primeiro pulso.
4. Agendar o próximo pulso com `setTimeout` usando o intervalo sorteado. Cada callback dispara som e adiciona/remova uma classe CSS de pulso no círculo.
5. Guardar todos os identificadores de agendamento em uma referência e limpá-los ao finalizar, desmontar componente ou detectar erro.
6. Se o disparo de áudio gerar exceção ou promessa rejeitada durante a rodada, parar a rodada, não chamar a API de salvamento e explicar que ela deverá ser iniciada novamente.

O agendamento não precisa ser persistido nem enviado à API. A condição e a faixa de intervalos são suficientes para análise do experimento.

## 7. Arquitetura e diretórios

```text
.
├── README.md
├── .env.exemplo
├── compose.yml
├── images/
│   ├── icone_sentempo.png
│   └── logo_principal.png
├── nginx/
│   └── nginx.conf
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── principal.tsx
│       ├── Aplicacao.tsx
│       ├── estilos.css
│       ├── tipos/
│       │   ├── participante.ts
│       │   ├── tentativa.ts
│       │   └── administracao.ts
│       ├── paginas/
│       │   ├── Entrada.tsx
│       │   ├── Inicio.tsx
│       │   ├── Experimento.tsx
│       │   └── Administracao.tsx
│       ├── componentes/
│       │   ├── FormularioAcesso.tsx
│       │   ├── SeletorTempo.tsx
│       │   ├── SeletorCondicao.tsx
│       │   ├── CartaoProgresso.tsx
│       │   ├── TabelaResultados.tsx
│       │   ├── CirculoEstimulo.tsx
│       │   ├── BotaoFinalizar.tsx
│       │   ├── ResumoEstatisticas.tsx
│       │   └── TabelaParticipantes.tsx
│       ├── servicos/
│       │   ├── api.ts
│       │   ├── participantes.ts
│       │   ├── tentativas.ts
│       │   └── administracao.ts
│       ├── ganchos/
│       │   ├── usarParticipante.ts
│       │   ├── usarExperimento.ts
│       │   └── usarAdministracao.ts
│       └── utilitarios/
│           ├── estimulo.ts
│           ├── formatacao.ts
│           └── validacao.ts
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── alembic.ini
    ├── migracoes/
    └── app/
        ├── principal.py
        ├── nucleo/
        │   ├── configuracoes.py
        │   ├── seguranca.py
        │   └── dependencias.py
        ├── banco/
        │   ├── conexao.py
        │   └── base.py
        ├── entidades/
        │   ├── participante.py
        │   └── tentativa.py
        ├── esquemas/
        │   ├── participante.py
        │   ├── tentativa.py
        │   └── administracao.py
        ├── repositorios/
        │   ├── participantes.py
        │   └── tentativas.py
        ├── servicos/
        │   ├── participante_servico.py
        │   ├── tentativa_servico.py
        │   ├── estatisticas_servico.py
        │   └── exportacao_servico.py
        └── rotas/
            ├── participantes.py
            ├── tentativas.py
            ├── administracao.py
            └── saude.py
```

Separar entidades SQLAlchemy, esquemas Pydantic, regras de serviço e rotas. Rotas não devem conter cálculo estatístico, SQL direto ou regra de duplicidade.

## 8. Modelo de dados

### 8.1 Enumeração `condicao`

Usar enum PostgreSQL ou `VARCHAR` com restrição `CHECK` para valores exatos:

```text
SEM_ESTIMULO | RAPIDO | LENTO
```

### 8.2 Tabela `participantes`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID ou bigint | chave primária |
| `nome` | varchar(120) | nome informado, com espaços externos removidos |
| `nome_normalizado` | varchar(120) | nome em minúsculas para consulta case-insensitive |
| `codigo` | char(4) | exatamente quatro dígitos |
| `criado_em` | timestamp com fuso | obrigatório, padrão atual |
| `atualizado_em` | timestamp com fuso | obrigatório, atualizado em modificações |

Constraints e índices:

- `UNIQUE (nome_normalizado, codigo)`;
- `CHECK (codigo ~ '^[0-9]{4}$')`;
- índice em `(nome_normalizado, codigo)`;
- opcionalmente, índice por `criado_em` para o dashboard.

### 8.3 Tabela `tentativas`

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | UUID ou bigint | chave primária |
| `participante_id` | FK | referência a `participantes.id`, obrigatório |
| `tempo_alvo_ms` | integer | somente `5000`, `15000` ou `30000` |
| `condicao` | enum/varchar | uma das três condições |
| `resultado_ms` | numeric(12,3) | maior que zero; manter precisão de ms enviada |
| `erro_ms` | numeric(12,3) | calculado no backend |
| `erro_absoluto_ms` | numeric(12,3) | calculado no backend, não negativo |
| `criado_em` | timestamp com fuso | obrigatório, padrão atual |

Constraints e índices:

- `UNIQUE (participante_id, tempo_alvo_ms, condicao)` — proteção definitiva contra repetição, inclusive em duas abas;
- `CHECK (tempo_alvo_ms IN (5000, 15000, 30000))`;
- `CHECK (resultado_ms > 0)`;
- `CHECK (erro_absoluto_ms >= 0)`;
- índice em `participante_id`;
- índices compostos para relatórios: `(condicao, tempo_alvo_ms)` e `(criado_em)`.

Não armazenar áudio, eventos de pulso, IP, dispositivo, localização, cookies de rastreamento ou resultados inválidos.

## 9. Contratos da API

Prefixo: `/api`. Respostas e campos em JSON usam português. Datas em ISO 8601 UTC. Erros seguem o formato FastAPI, acrescidos de um campo `mensagem` amigável quando adequado.

### 9.1 Saúde

`GET /api/saude`

Resposta `200`:

```json
{ "situacao": "ok" }
```

### 9.2 Criar ou recuperar participante

`POST /api/participantes/acessar`

```json
{
  "nome": "Ana Silva",
  "codigo": "0042"
}
```

Resposta `200` para perfil existente ou `201` para perfil criado:

```json
{
  "id": "2b161d3a-4ceb-4bcc-96f1-d5fcd6c8e8d4",
  "nome": "Ana Silva",
  "codigo": "0042",
  "progresso": {
    "concluidas": 2,
    "total": 9
  }
}
```

Retornar `422` para nome vazio após trim ou código fora de `^[0-9]{4}$`.

### 9.3 Consultar participante e progresso

`GET /api/participantes/{participante_id}`

Resposta `200`:

```json
{
  "id": "2b161d3a-4ceb-4bcc-96f1-d5fcd6c8e8d4",
  "nome": "Ana Silva",
  "codigo": "0042",
  "progresso": { "concluidas": 2, "total": 9 },
  "tentativas": [
    {
      "id": "965bb554-38b9-4683-8a1b-e320d44a2087",
      "tempo_alvo_ms": 5000,
      "condicao": "RAPIDO",
      "resultado_ms": 5321.736,
      "erro_ms": 321.736,
      "erro_absoluto_ms": 321.736,
      "criado_em": "2026-09-23T14:30:00Z"
    }
  ],
  "combinacoes": [
    { "tempo_alvo_ms": 5000, "condicao": "SEM_ESTIMULO", "concluida": false },
    { "tempo_alvo_ms": 5000, "condicao": "RAPIDO", "concluida": true }
  ]
}
```

Retornar `404` se não existir.

### 9.4 Salvar tentativa

`POST /api/participantes/{participante_id}/tentativas`

```json
{
  "tempo_alvo_ms": 15000,
  "condicao": "LENTO",
  "resultado_ms": 14621.481
}
```

O backend deve:

1. validar existência do participante;
2. validar tempo, condição e resultado finito e positivo;
3. verificar que a combinação ainda está disponível;
4. calcular `erro_ms` e `erro_absoluto_ms` no servidor;
5. persistir em transação;
6. converter a violação da restrição única em `409 Conflict`, sem vazar detalhes do banco.

Resposta `201`:

```json
{
  "id": "bd8d25a7-f91e-4b55-b70f-1fc3228a5a91",
  "participante_id": "2b161d3a-4ceb-4bcc-96f1-d5fcd6c8e8d4",
  "tempo_alvo_ms": 15000,
  "condicao": "LENTO",
  "resultado_ms": 14621.481,
  "erro_ms": -378.519,
  "erro_absoluto_ms": 378.519,
  "criado_em": "2026-09-23T14:35:00Z"
}
```

Erros: `404` participante inexistente; `409` combinação já concluída; `422` payload inválido.

Não criar endpoint de edição ou exclusão de tentativas.

### 9.5 Login administrativo

`POST /api/administracao/acessar`

```json
{
  "nome": "pesquisador",
  "codigo": "1234"
}
```

Comparar nome sem diferenciar maiúsculas/minúsculas e código de modo seguro. Em sucesso, retornar token de curta duração:

```json
{
  "token_acesso": "<jwt>",
  "tipo_token": "bearer",
  "expira_em": "2026-09-23T18:00:00Z"
}
```

Retornar sempre `401` para credenciais inválidas, sem indicar qual campo falhou. Limitar tentativas por IP/rota em produção, quando o proxy oferecer suporte.

### 9.6 Dashboard administrativo

Todas as rotas abaixo exigem `Authorization: Bearer <token_acesso>`.

`GET /api/administracao/resumo`

```json
{
  "participantes_total": 18,
  "participantes_completos": 7,
  "tentativas_validas_total": 103,
  "tentativas_esperadas": 162,
  "taxa_conclusao_percentual": 63.58,
  "erro_medio_ms": -112.420,
  "erro_absoluto_medio_ms": 812.903,
  "tendencia_geral": {
    "predominante": "ABAIXO",
    "abaixo": 58,
    "acima": 43,
    "igual": 2
  }
}
```

`GET /api/administracao/estatisticas?agrupar_por=condicao`

Aceitar somente `condicao` ou `tempo`. Resposta:

```json
{
  "agrupar_por": "condicao",
  "itens": [
    {
      "chave": "RAPIDO",
      "quantidade_tentativas": 34,
      "erro_medio_ms": -201.500,
      "erro_absoluto_medio_ms": 760.100,
      "abaixo": 21,
      "acima": 13,
      "igual": 0,
      "tendencia_predominante": "ABAIXO"
    }
  ]
}
```

`GET /api/administracao/participantes?pagina=1&tamanho=20&busca=ana`

Retornar paginação, nome, código, data de criação, número de tentativas concluídas e situação (`INCOMPLETO`/`COMPLETO`). A busca deve ser por nome case-insensitive; nunca retornar token ou variáveis de ambiente.

`GET /api/administracao/participantes/{participante_id}`

Retornar perfil, progresso, as nove combinações, tentativas e resumo individual com médias/tendência.

`GET /api/administracao/exportacao.csv`

Retornar `text/csv; charset=utf-8` com `Content-Disposition: attachment`. Usar UTF-8 com BOM para boa abertura em planilhas comuns. Separador `;` e cabeçalho:

```text
participante_id;nome;codigo;tempo_alvo_ms;condicao;resultado_ms;erro_ms;erro_absoluto_ms;criado_em
```

Formatar números de forma consistente para CSV, preferencialmente com ponto decimal para interoperabilidade. Não aplicar filtros ocultos nem alterar os dados ao exportar.

## 10. Dashboard administrativo

O dashboard deve ter consulta clara e rica, sem sobrecarregar a leitura.

- Cards gerais: total de participantes, participantes completos, tentativas válidas, taxa de conclusão, erro médio e erro absoluto médio.
- Bloco de tendência geral: contagens abaixo/acima/igual e tendência predominante.
- Tabela ou gráfico simples de estatísticas por condição: sem estímulo, rápido e lento.
- Tabela ou gráfico simples de estatísticas por tempo: 5 s, 15 s e 30 s.
- Cada linha deve trazer quantidade, erro médio, erro absoluto médio e tendência.
- Lista paginada e pesquisável de participantes.
- Tela/painel de detalhes do participante com suas combinações concluídas e pendentes.
- Botão de exportação CSV.

Gráficos devem ter equivalente textual/tabelar, rótulos visíveis e cores acessíveis. Não é obrigatório usar biblioteca de gráficos; cartões e tabelas bem apresentados atendem ao objetivo.

## 11. Segurança e privacidade mínimas

- Usar HTTPS em produção; Nginx deve redirecionar HTTP para HTTPS quando certificados forem configurados.
- Nunca versionar `.env`, senhas, tokens ou dados reais. Versionar apenas `.env.exemplo`.
- Variáveis administrativas são somente do backend; nunca prefixá-las com `VITE_` nem enviá-las ao frontend.
- Armazenar senha/código administrativo como segredo de ambiente. Como o requisito pede nome + código, aceitar código em texto no ambiente, mas documentar que em produção a opção recomendada é fornecer hash Argon2/bcrypt e comparar com verificação apropriada.
- JWT deve ter segredo forte, algoritmo explícito, expiração curta e validação de expiração. Não registrar tokens ou credenciais nos logs.
- Configurar CORS com origens explícitas; em produção usar o domínio real, sem `*`.
- Validar entrada no frontend por experiência e no backend por segurança.
- Restringir endpoints administrativos com dependência de autenticação. Participantes só acessam seu perfil por um identificador retornado pela API; para um projeto acadêmico local, isso é suficiente, mas não constitui autenticação forte de dados individuais.
- Não expor stack trace, SQL ou credenciais em respostas de erro de produção.
- Definir limite razoável de tamanho para `nome` e paginação máxima de 100 itens.

## 12. Variáveis de ambiente

Criar `.env.exemplo` na raiz:

```dotenv
# Banco usado pelo serviço backend dentro do Docker
POSTGRES_DB=nudges
POSTGRES_USER=nudges_usuario
POSTGRES_PASSWORD=troque_esta_senha

# Backend
BANCO_URL=postgresql+psycopg://nudges_usuario:troque_esta_senha@banco:5432/nudges
CHAVE_SECRETA_JWT=gere_uma_chave_longa_aleatoria
ALGORITMO_JWT=HS256
EXPIRACAO_TOKEN_MINUTOS=120
NOME_ADMINISTRADOR=pesquisador
CODIGO_ADMINISTRADOR=1234
ORIGENS_CORS=http://localhost:5173,http://localhost:8080
AMBIENTE=desenvolvimento

# Frontend: somente URL pública da API
VITE_URL_API=http://localhost:8000/api
```

Para produção, ajustar `BANCO_URL` ao host correto, `ORIGENS_CORS` ao domínio HTTPS e `VITE_URL_API` para `/api` quando Nginx servir tudo no mesmo domínio. Gerar `CHAVE_SECRETA_JWT` com fonte criptograficamente segura. Nunca reutilizar os valores de exemplo.

## 13. Docker e execução local

### 13.1 Serviços do Compose

`compose.yml` deve definir:

| Serviço | Responsabilidade | Porta local sugerida |
| --- | --- | --- |
| `banco` | PostgreSQL com volume persistente | não expor em produção; opcional `5432` em desenvolvimento |
| `backend` | FastAPI/Uvicorn e migrações | `8000` |
| `frontend` | Vite em desenvolvimento ou build estático | `5173` no desenvolvimento |
| `proxy` | Nginx para produção, SPA e `/api` | `80` |

- `banco` deve possuir volume nomeado, por exemplo `dados_postgres`.
- O backend só pode iniciar após o banco ficar saudável; usar `healthcheck` no PostgreSQL e `depends_on` com condição de saúde quando suportado.
- Executar migrações Alembic antes de aceitar tráfego no backend.
- Não montar código-fonte nem expor portas de banco em uma configuração de produção.
- Em imagem final do frontend, usar build multiestágio e Nginx para arquivos estáticos.

### 13.2 Desenvolvimento sem Docker

Pré-requisitos: Node.js LTS, Python 3.12+, PostgreSQL 16+ e uma instância de banco criada conforme o `.env`.

```bash
cp .env.exemplo .env

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.principal:aplicacao --reload --port 8000
```

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`. Confirmar `GET http://localhost:8000/api/saude` antes de testar o fluxo.

### 13.3 Desenvolvimento com Docker

```bash
cp .env.exemplo .env
docker compose up --build
```

Ao finalizar:

```bash
docker compose down
```

Não usar `down -v` em ambiente com dados que precisam ser preservados, pois remove o volume do banco.

## 14. Requisitos de implementação do frontend

- Usar React Router para as rotas descritas.
- Usar TypeScript estrito; evitar `any`.
- Centralizar chamadas HTTP em `servicos/api.ts`, tratando base URL, JSON, erros e cabeçalho de autorização administrativa.
- Guardar `participante_id` apenas para continuidade de sessão do navegador. Ao carregar, sempre buscar o perfil atual da API antes de decidir disponibilidade de combinações.
- Guardar token administrativo apenas durante a sessão; tratar expiração com retorno à tela de login.
- O botão de finalizar deve possuir área de toque confortável e foco visível pelo teclado.
- Implementar estados de carregamento, erro de rede e vazio; não deixar botão ativo enquanto uma requisição está em andamento.
- Formatar valores para leitura humana no frontend, por exemplo `5,32 s`, mas preservar milissegundos no transporte e nos cálculos.
- Garantir limpeza de `setTimeout`, nós de áudio e recursos de animação em desmontagem do componente.
- Não usar o tempo de renderização, `Date.now()` ou contador CSS para medir resultado. A única fonte no cliente é `performance.now()`.

## 15. Requisitos de implementação do backend

- FastAPI deve expor OpenAPI em desenvolvimento (`/docs`) e ocultar ou proteger documentação em produção, conforme configuração.
- Usar sessão SQLAlchemy por requisição e encerrá-la corretamente.
- Usar migrações Alembic desde a primeira versão do schema; não depender de criação automática de tabelas em produção.
- Pydantic deve rejeitar condição e tempos fora das enumerações permitidas.
- Converter `resultado_ms` para tipo decimal apropriado sem perda indevida de precisão; rejeitar `NaN`, infinito e valores `<= 0`.
- A operação de salvar tentativa deve ser atômica. A restrição do banco é obrigatória mesmo que o serviço valide antes.
- Calcular agregações no banco quando possível, com `AVG`, `COUNT` e somas condicionais; proteger caso não existam tentativas retornando valores nulos ou zero de maneira consistente.
- Paginação deve retornar `pagina`, `tamanho`, `total_itens`, `total_paginas` e `itens`.
- Configurações devem vir de classe Pydantic Settings/lógica equivalente, com falha explícita se segredos exigidos faltarem em produção.

## 16. Critérios de aceite

O projeto estará aceito quando todos os itens forem demonstráveis:

1. Um novo nome+código cria perfil e o mesmo nome (com qualquer variação de maiúsculas/minúsculas)+código retoma o mesmo perfil.
2. O código `0042` é salvo e devolvido como `0042`.
3. Nomes iguais com códigos diferentes geram perfis diferentes.
4. O menu apresenta exatamente nove combinações e o progresso correto.
5. A pessoa precisa escolher tempo antes de condição.
6. Em uma rodada, não há cronômetro, contador, barra de progresso nem resultado visível.
7. `SEM_ESTIMULO` não dispara som ou círculo pulsante.
8. `RAPIDO` usa somente intervalos dentro de 300–700 ms; `LENTO`, somente 900–1600 ms.
9. Em condições estimuladas, som e pulso visual são disparados juntos a cada evento.
10. Se o áudio não iniciar ou falhar, não existe requisição de salvamento e o progresso não aumenta.
11. A duração enviada pelo navegador é obtida por `performance.now()` e é enviada em ms sem arredondamento prévio.
12. O backend calcula e persiste corretamente `erro_ms` e `erro_absoluto_ms`.
13. Após salvar uma combinação, ela fica indisponível e uma nova tentativa pela mesma combinação recebe `409` na API.
14. Ao voltar ou recarregar depois de tentativa concluída, o progresso e a tabela continuam corretos.
15. A área administrativa exige credenciais definidas no `.env` e não aceita credenciais inválidas.
16. O dashboard mostra totais, progresso, médias, estatísticas por condição/tempo, tendência, lista e detalhe de participantes.
17. O CSV baixa com todos os campos definidos, UTF-8 com BOM e separador `;`.
18. Não existem ações administrativas de exclusão ou edição.
19. `docker compose up --build` sobe banco, backend e frontend/proxy sem ajustes manuais além de configurar `.env`.
20. `GET /api/saude` responde `200` após a inicialização.

## 17. Testes mínimos obrigatórios

### Backend

- Testar normalização de nome, preservação do código e criação/recuperação do participante.
- Testar validação de todos os códigos inválidos e tempos/condições inválidos.
- Testar cálculo de erro positivo, negativo e zero.
- Testar rejeição de resultado zero, negativo, `NaN` e infinito.
- Testar que tentativa duplicada retorna `409`, inclusive simulando violação da restrição única.
- Testar que estatísticas por condição e por tempo retornam quantidade, médias e tendência esperadas.
- Testar acesso administrativo válido, inválido e token expirado.
- Testar CSV, cabeçalho, content type e dados básicos.

### Frontend

- Testar validação do formulário de entrada.
- Testar que condição não pode ser selecionada antes do tempo.
- Testar que combinações concluídas são desabilitadas.
- Testar cálculo baseado em `performance.now()` com relógio simulado.
- Testar que erro de inicialização/execução de áudio não chama o serviço de salvamento.
- Testar limpeza dos agendamentos do estímulo ao finalizar ou desmontar.
- Testar que a tela ativa não renderiza cronômetro, resultado, contagem ou barra de progresso.

Além dos testes automatizados, fazer teste manual em Chrome/Firefox e em uma tela móvel, com som permitido e com som bloqueado.

## 18. Ordem sugerida de implementação

1. Criar repositório, `.gitignore`, `.env.exemplo`, estrutura de diretórios e Compose.
2. Configurar PostgreSQL, SQLAlchemy, Alembic, entidades, constraints e rota de saúde.
3. Implementar participante, acesso/retomada e consulta de progresso.
4. Implementar salvamento transacional de tentativa e seus testes.
5. Implementar autenticação administrativa, estatísticas, lista, detalhe e exportação CSV.
6. Criar frontend base, Tailwind, rotas, serviços de API e entrada de participante.
7. Implementar menu, seleção tempo→condição e tabela de resultados.
8. Implementar experimento sem estímulo e confirmar medição/salvamento.
9. Implementar Tone.js, círculo CSS e condições rápida/lenta, com tratamento rigoroso de falha de áudio.
10. Implementar dashboard administrativo responsivo.
11. Integrar Docker/Nginx, CORS, variáveis de produção e migrações no boot.
12. Executar testes, checklist de aceite e revisão de acessibilidade.

## 19. Fora de escopo

Não implementar sem nova decisão explícita:

- cadastro por e-mail, senha de participante ou recuperação de acesso;
- edição, exclusão ou reinício de tentativas;
- repetição de uma combinação concluída;
- música, efeitos sonoros complexos, gamificação ou pontuação;
- telemetria, analytics de terceiros, rastreamento de dispositivo ou coleta de dados além dos especificados;
- comparação inferencial avançada, significância estatística ou diagnóstico clínico;
- múltiplos pesquisadores, níveis de permissão ou painel de escrita;
- armazenamento de rodadas abandonadas ou que falharam no áudio.

## 20. Qualidade esperada

Priorizar clareza, previsibilidade e neutralidade experimental. A interface deve ser acolhedora, mas não induzir o participante a estimar mais rápido ou mais devagar. Todos os resultados exibidos e exportados devem vir de dados persistidos e cálculos verificáveis no backend.
