# Contrato: gráfico de gasto por categoria (US4)

## `domain/statistics/categoryShare.ts`
- `toCategoryShare(spending: {categoriaId; total}[], topN = 5): CategoryShare[]` — ver data-model.
- `toCategoryShareFull(spending): CategoryShare[]` — sem "Outras" (tela de detalhamento).
- Garantias testadas: soma de `pct` = 100 (quando total > 0); lista vazia quando total = 0;
  ≤ topN + 1 itens; "Outras" sempre por último.

## `components/DonutChart.tsx`
```ts
type DonutSegment = { key: string; value: number; color: string };
type Props = { segments: DonutSegment[]; size?: number /* 160 */; thickness?: number /* 22 */;
  centerLabel?: ReactNode; onPress?: () => void; accessibilityLabel: string };
```
- `react-native-svg` (`Svg`, `G` rotacionado -90°, `Circle` por segmento com
  `strokeDasharray`/`strokeDashoffset`); trilho de fundo `$borderColor`.
- `value` todos 0 → não renderiza anel (o chamador mostra o estado vazio).
- Envolto em `Pressable` quando `onPress` existe; `accessibilityRole="button"`.

## Paleta — `src/theme/colors.ts`
`chartCategorical: [c1..c5]` + `chartOther` (cinza neutro). Atribuída por índice do ranking.

## UI — `estatisticas.tsx`
- Seção "Gasto por categoria" (sem seletor — FR-014 removido, prévia
  `design/inicio-estatisticas/GastoPorCategoria.preview.html` v2): `DonutChart` 140px (total no centro,
  conforme `basis`) à esquerda + legenda compacta à direita (cor, nome, %), e link "Ver detalhes ›".
  Toque na rosca ou no link → `router.push({ pathname: '/inicio/estatisticas-categorias', params:
  { kind, anchor, basis } })`. Estado vazio (total 0): "Nenhum gasto neste período."
- Cores por posição no ranking (paleta validada para daltonismo; as cores dos ícones de categoria
  reprovaram no validador).
- Comparação com o período anterior em verde escuro (contraste ≥ 4.5:1).

## Rota — `(tabs)/inicio/estatisticas-categorias.tsx`
- Registrada em `(tabs)/inicio/_layout.tsx`.
- Lê params, chama `useStatistics(kind, basis)` (âncora do param), exibe `DonutChart` grande com
  `toCategoryShare` e, abaixo, lista plana com divisórias de `toCategoryShareFull`: ícone, nome,
  barra/percentual, `Money`.
- Header no padrão das demais telas (botão voltar + título "Gasto por categoria" + período e base).
- Rosca 220px; as categorias que formam "Outras" vêm por último sob o rótulo "Em Outras".
- Tocar numa linha destaca o segmento (os demais esmaecem) e o centro mostra % e valor; tocar de
  novo desfaz. Linha de categoria agrupada em "Outras" destaca o segmento "Outras".
