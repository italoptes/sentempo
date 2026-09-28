# Conformidade WCAG 2.2 — Sentempo

Este documento registra as melhorias de acessibilidade implementadas no frontend do Sentempo. A análise considera os critérios de sucesso da WCAG 2.2 e o contexto de uma aplicação React de página única.

> A implementação dos critérios não substitui testes manuais com teclado, leitores de tela, zoom e dispositivos de toque.

## 2.4.2 — Página com título (Nível A)

### Alteração

Foi criado o componente `TituloPagina`, responsável por atualizar o título do documento sempre que a rota muda.

Títulos implementados:

- `Entrar no experimento — Sentempo`;
- `Início — Sentempo`;
- `Preparação do experimento — Sentempo`;
- `Experimento livre — Sentempo`;
- `Administração — Sentempo`.

### Benefício

O título permite que pessoas que utilizam leitores de tela, histórico do navegador ou várias abas identifiquem imediatamente qual tela do Sentempo está aberta.

### Como demonstrar

Navegar entre as rotas e observar a alteração do texto exibido na aba do navegador.

## 2.4.7 — Foco visível (Nível AA)

### Alteração

Foi criado um indicador global de foco com dois anéis contrastantes: branco e verde escuro. A combinação permite identificar o foco tanto em fundos claros quanto em fundos escuros.

Os botões de exclusão que antes eram revelados somente ao passar o mouse agora também ficam visíveis quando recebem foco pelo teclado.

### Benefício

Pessoas que navegam por teclado conseguem identificar qual controle está ativo durante toda a interação, inclusive nas ações que permanecem visualmente discretas para quem usa mouse.

### Como demonstrar

Pressionar `Tab` repetidamente nas telas de início e resultados. O indicador deve acompanhar todos os controles e revelar os botões de exclusão quando eles recebem foco.

## 2.5.8 — Tamanho do alvo (mínimo) (Nível AA)

### Alteração

As áreas acionáveis pequenas passaram a ter no mínimo `44 × 44` pixels. A alteração abrange os indicadores de página do desafio, as ações de jogar, excluir tentativas e excluir tempos, além das ações compactas nas tabelas administrativas.

O indicador circular do desafio continua visualmente pequeno, mas agora está dentro de uma área de toque maior e transparente.

Nos cards mobile de resultados, o botão de exclusão foi movido para um cabeçalho próprio, ao lado da condição. O tempo deixou de ser repetido dentro de cada card, pois já identifica o agrupamento. Assim, a área de `44 × 44` pixels é preservada sem sobrepor informações.

### Benefício

Áreas maiores reduzem toques acidentais e facilitam a operação para pessoas com baixa precisão motora ou que utilizam a aplicação em telas pequenas.

### Como demonstrar

Ativar a visualização mobile do navegador e inspecionar a área dos botões. O círculo de paginação deve ocupar visualmente pouco espaço, mas seu botão deve medir `44 × 44` pixels.

## 4.1.3 — Mensagens de status (Nível AA)

### Alteração

Foi incorporado o componente `Ring`, disponibilizado pelo [Loading UI](https://www.loading-ui.com/docs/components/ring), e criado o componente reutilizável `IndicadorCarregamento`.

O indicador combina a animação visual com:

- `role="status"`;
- `aria-live="polite"`;
- `aria-atomic="true"`;
- mensagem de texto visível;
- SVG decorativo removido da árvore de acessibilidade.

O indicador é utilizado ao carregar o perfil, o Modo Livre e a administração, ao autenticar e ao salvar resultados.

### Benefício

Além de enxergar que uma operação está em andamento, pessoas que utilizam leitores de tela recebem a mensagem sem que o foco seja movido.

### Como demonstrar

Simular uma conexão lenta nas ferramentas do navegador. Durante o carregamento, o anel e a mensagem devem aparecer visualmente; com um leitor de tela, a mensagem deve ser anunciada como status.

## 1.4.11 — Contraste não textual (Nível AA)

### Alteração

Foi criado o token `borda-controle` com a cor `#5F7775`. Sobre branco, essa cor tem relação de contraste aproximada de `4,79:1`, superando o mínimo de `3:1` para limites e estados de componentes.

O novo token foi aplicado em campos, seletores, paginação e botões de condição. Bordas de erro foram reforçadas e o preenchimento da barra de progresso passou a usar o verde-petróleo institucional.

### Benefício

Campos e controles deixam de depender de bordas em menta muito clara, tornando seus limites e estados mais perceptíveis para pessoas com baixa visão.

### Como demonstrar

Comparar um cartão decorativo, que mantém a borda suave, com um campo de formulário ou opção selecionável, que agora apresenta um limite mais escuro e claramente identificável.

## 2.4.1 — Contornar blocos (Nível A)

### Alteração

Foi adicionado o link “Ir para o conteúdo principal” antes do roteador da aplicação. Ele permanece fora da tela durante o uso convencional e torna-se visível quando recebe foco.

Todas as variações de tela, incluindo carregamento, erro e rodada ativa, agora expõem o destino `#conteudo-principal`, que pode receber foco programaticamente.

### Benefício

Quem navega por teclado pode ignorar cabeçalhos e outros blocos repetidos, chegando diretamente à tarefa principal da página.

### Como demonstrar

Recarregar uma rota e pressionar `Tab` uma vez. Acionar o link exibido deve mover a navegação diretamente para o conteúdo principal.

## 2.4.3 — Ordem do foco (Nível A)

### Alteração

O componente `GerenciadorFocoRota` move o foco para o conteúdo principal após uma navegação interna da aplicação, sem interferir no primeiro carregamento da página.

Também foram tratados os seguintes fluxos:

- ao abrir o detalhe de um participante, o painel recebe foco antes de ser rolado para a área visível;
- o diálogo de confirmação envia o foco ao botão de cancelamento e o devolve ao controle que o abriu;
- o modal de instalação PWA contém a navegação por `Tab` e restaura o foco ao ser fechado.

### Benefício

A sequência de navegação permanece lógica mesmo quando React substitui a tela ou insere conteúdo sem um recarregamento tradicional do navegador.

### Como demonstrar

Usando apenas teclado, abrir e fechar uma confirmação e verificar o retorno do foco. Em seguida, navegar para outra rota e observar que o conteúdo principal recebe o foco.

## 3.3.3 — Sugestão de erro (Nível AA)

### Alteração

O cadastro de tempo personalizado deixou de utilizar alertas genéricos do navegador. O campo agora possui estado controlado, limites nativos, instrução persistente e mensagem de correção associada por `aria-describedby`.

Quando o valor é inválido, a aplicação:

- marca o campo com `aria-invalid="true"`;
- apresenta “Digite um número inteiro entre 1 e 120 segundos”;
- anuncia a mensagem com `role="alert"`;
- devolve o foco ao campo que precisa ser corrigido.

Erros retornados pela API também são complementados com uma orientação para revisar os dados e tentar novamente.

### Benefício

A pessoa não recebe apenas a informação de que algo falhou: ela sabe exatamente qual formato é aceito e onde deve realizar a correção.

### Como demonstrar

Tentar adicionar os valores `0`, `121`, `1.5` e um campo vazio. Em todos os casos, a mensagem deve explicar o intervalo e o formato esperado sem abrir um alerta do navegador.

## 2.5.3 — Rótulo no nome acessível (Nível A)

### Alteração

Controles compactos e repetidos receberam nomes acessíveis contextualizados. Exemplos:

- `Excluir tempo personalizado de 20 segundos`;
- `Excluir tentativa de 15 segundos, condição Estímulo rápido`;
- `Ver detalhes de Ana Silva`;
- `Excluir participante Ana Silva`.

Os símbolos visuais de exclusão foram marcados com `aria-hidden="true"`, evitando que sejam anunciados de maneira inconsistente. Nos botões que possuem texto visível, o nome acessível preserva expressões como “Ver detalhes” e “Excluir”.

### Benefício

Pessoas que utilizam leitor de tela ou controle por voz conseguem distinguir e acionar diretamente controles que visualmente seriam apenas um “X”, “Ver” ou “Excluir”.

### Como demonstrar

Percorrer uma tabela de resultados com um leitor de tela e comparar os anúncios dos diferentes botões de exclusão. Cada botão deve informar exatamente qual tentativa ou participante será afetado.
