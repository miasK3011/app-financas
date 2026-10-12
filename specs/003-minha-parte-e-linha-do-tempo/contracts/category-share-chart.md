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
- Seção "Gasto por categoria": `SegmentedControl` `Lista | Gráfico` no cabeçalho da seção.
- "Gráfico": `DonutChart` (total no centro, conforme `basis`) + legenda compacta (cor, nome, %);
  toque → `router.push({ pathname: '/inicio/estatisticas-categorias', params: { kind, anchor, basis } })`.

## Rota — `(tabs)/inicio/estatisticas-categorias.tsx`
- Registrada em `(tabs)/inicio/_layout.tsx`.
- Lê params, chama `useStatistics(kind, basis)` (âncora do param), exibe `DonutChart` grande com
  `toCategoryShare` e, abaixo, lista plana com divisórias de `toCategoryShareFull`: ícone, nome,
  barra/percentual, `Money`.
- Header no padrão das demais telas (botão voltar + título "Gasto por categoria" + período e base).
