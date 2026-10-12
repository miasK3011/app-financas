/**
 * Participação de cada categoria no gasto do período (FR-015/FR-016 da
 * feature 003, issue #24) — base do gráfico de rosca de Estatísticas e
 * da tela de detalhamento por categoria.
 */
export type CategoryShare = {
  /** `categoriaId`, `'sem-categoria'` ou `'outras'` — chave estável da linha/segmento. */
  key: string;
  categoriaId: string | null;
  total: number;
  /** Porcentagem do total do período, 1 casa decimal; a lista soma exatamente 100. */
  pct: number;
  /** Posição no ranking (0 = maior) — define a cor do segmento. */
  rank: number;
  isOutras: boolean;
};

type CategoryTotal = { categoriaId: string | null; total: number };

function ranked(spending: CategoryTotal[]): CategoryTotal[] {
  return spending.filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total);
}

/** `pct` com 1 casa; o último item absorve o arredondamento para a soma dar 100. */
function withPercents(items: Omit<CategoryShare, 'pct'>[], sum: number): CategoryShare[] {
  let accumulated = 0;
  return items.map((item, index) => {
    if (index === items.length - 1) {
      return { ...item, pct: Math.round((100 - accumulated) * 10) / 10 };
    }
    const pct = Math.round((item.total / sum) * 1000) / 10;
    accumulated += pct;
    return { ...item, pct };
  });
}

function toItem(entry: CategoryTotal, rank: number): Omit<CategoryShare, 'pct'> {
  return {
    key: entry.categoriaId ?? 'sem-categoria',
    categoriaId: entry.categoriaId,
    total: entry.total,
    rank,
    isOutras: false,
  };
}

/**
 * As `topN` maiores categorias + um único "Outras" (por último, só se
 * houver o que agrupar). Totais ≤ 0 são ignorados; sem gasto → `[]`.
 */
export function toCategoryShare(spending: CategoryTotal[], topN = 5): CategoryShare[] {
  const list = ranked(spending);
  const sum = list.reduce((acc, entry) => acc + entry.total, 0);
  if (sum === 0) return [];

  const items = list.slice(0, topN).map(toItem);
  const rest = list.slice(topN);
  if (rest.length > 0) {
    items.push({
      key: 'outras',
      categoriaId: null,
      total: rest.reduce((acc, entry) => acc + entry.total, 0),
      rank: topN,
      isOutras: true,
    });
  }
  return withPercents(items, sum);
}

/** Todas as categorias, sem agrupar — a lista da tela de detalhamento. */
export function toCategoryShareFull(spending: CategoryTotal[]): CategoryShare[] {
  const list = ranked(spending);
  const sum = list.reduce((acc, entry) => acc + entry.total, 0);
  if (sum === 0) return [];
  return withPercents(list.map(toItem), sum);
}

/** "38,2%" — porcentagem com 1 casa, vírgula decimal (pt-BR). */
export function formatSharePct(pct: number): string {
  return `${pct.toFixed(1).replace('.', ',')}%`;
}
