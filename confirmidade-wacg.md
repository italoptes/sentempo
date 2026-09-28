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
