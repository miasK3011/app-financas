# Quickstart / Validação — Feature 003

## Pré-requisitos
- Branch `003-minha-parte-e-linha-do-tempo`, `npm install`.
- Automático: `npx jest --testPathIgnorePatterns '/.claude/'` verde; `npx tsc --noEmit` sem erros
  novos além dos ~21 pré-existentes de typed-routes; `npx eslint src`.
- On-device: `npx expo start` (Expo Go no Android), com logs do Metro em um processo de fundo.

## Massa de dados (anonimizada, criada pelo app)
1. Renda do mês: R$ 5.000.
2. Pix "Jantar" R$ 100,00 hoje, dividido manualmente (minha parte R$ 40,00).
3. Cartão A (fecha dia X): "Mercado" R$ 300,00 em 1x, sem divisão, em uma data do mês passado
   próxima ao fechamento (fatura vencendo neste mês).
4. Cartão A: "TV" R$ 1.200,00 em 4x, hoje.
5. Cartão A: ao menos uma fatura antiga marcada como paga, idealmente em outro ano.
6. Gastos em ≥ 6 categorias diferentes no mês.

## Cenários
| # | US | Passos | Esperado |
|---|---|---|---|
| 1 | US1 | Abrir Início | Saldo desconta R$ 40 do Jantar (não R$ 100) e a parte das faturas; "Gastos" = soma das partes |
| 2 | US1 | Estatísticas › Mensal › Meu gasto ↔ Global | Total muda em R$ 60 (Jantar); categoria/maiores gastos/assinaturas mudam juntos; em Global aparece "Sua parte: R$ X" |
| 3 | US1 | Trocar período com Global ativo | Global continua selecionado |
| 4 | US2 | Compras no mês corrente | "TV" aparece uma vez, hoje, R$ 1.200 com selo "4x"; dias do mais recente ao mais antigo |
| 5 | US2 | Compras no mês passado | "Mercado" aparece no dia real da compra (não no vencimento) |
| 6 | US2 | Ativar "Só minhas" | Jantar some; card recalcula; combina com Cartão/Pix |
| 7 | US2 | Card de gasto sem filtro | Total + "Sua parte: R$ X" menor |
| 8 | US2 | Navegar a mês futuro | Visão de previsão por fatura igual à anterior |
| 9 | US3 | Abrir Cartão A | Só faturas não pagas do ano corrente; `< 2026 >` |
| 10 | US3 | "Mostrar pagas (n)" / "<" | Pagas aparecem; ano anterior navegável; limites desabilitam setas |
| 11 | US3 | Abrir uma fatura | Compras agrupadas por dia, mais recente primeiro |
| 12 | US4 | Estatísticas › Gasto por categoria › Gráfico | Rosca com 5 categorias + "Outras", total no centro |
| 13 | US4 | Tocar na rosca | Tela de detalhamento: rosca + lista com todas as categorias; % somam 100 |
| 14 | US4 | Alternar Meu/Global e reabrir | Gráfico e detalhamento seguem a base escolhida |

Referências: [spending-basis](contracts/spending-basis.md), [purchases-timeline](contracts/purchases-timeline.md),
[card-invoices-view](contracts/card-invoices-view.md), [category-share-chart](contracts/category-share-chart.md),
[data-model](data-model.md).
