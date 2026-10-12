/**
 * Tipos derivados da tela Compras (`data-model.md` da feature
 * 002-central-de-compras) — nunca persistidos, sempre recalculados a
 * partir de `Compra`/`Parcela`/`Fatura` já existentes.
 */

export type FormaPagamento = 'CARTAO' | 'PIX';

/**
 * Uma linha da linha do tempo de Compras (feature 003, FR-006/FR-006a) —
 * a unidade é a **Compra**, atribuída ao mês e ao dia pela data real da
 * compra. Substitui a unidade por Parcela da feature 002
 * (`specs/003-minha-parte-e-linha-do-tempo/contracts/purchases-timeline.md`).
 */
export type PurchaseListRow = {
  compraId: string;
  descricao: string;
  categoria: { icone: string; nome: string } | null;
  /** `Compra.valorTotalOriginal` — o valor cheio da compra, mesmo parcelada. */
  valor: number;
  /** Parte do usuário: Σ `Parcela.valorResponsabilidade` da compra. */
  valorResponsabilidade: number;
  /** `valorResponsabilidade < valor` — divisão manual ou reembolso vinculado (FR-008). */
  isSplit: boolean;
  formaPagamento: FormaPagamento;
  /** Presente apenas quando `formaPagamento = 'CARTAO'`. */
  nomeCartao: string | null;
  /**
   * Presente apenas quando `Compra.parcelasTotal > 1`. `atual > 1` só
   * acontece em compras importadas via CSV ("Parcela k/N").
   */
  parcelas: { atual: number; total: number } | null;
  /** Sempre a data real da compra. */
  dataCompra: Date;
};

/**
 * Uma parcela da visão de previsão de meses futuros (FR-013 da 002,
 * inalterada pela 003): a unidade continua sendo a Parcela, agrupada por
 * fatura.
 */
export type ForecastRow = {
  parcelaId: string;
  compraId: string;
  descricao: string;
  categoria: { icone: string; nome: string } | null;
  /** Valor desta parcela. */
  valor: number;
  /** Parte do usuário nesta parcela. */
  valorResponsabilidade: number;
  formaPagamento: FormaPagamento;
  nomeCartao: string | null;
  /** Presente apenas quando `Compra.parcelasTotal > 1`. */
  parcela: { atual: number; total: number } | null;
  /** `Fatura.dataVencimento` da parcela. */
  dataCompra: Date;
};

export type PaymentBreakdown = {
  total: number;
  /** Σ da parte do usuário nas mesmas linhas (FR-009 da 003). */
  totalResponsabilidade: number;
  porFormaPagamento: { formaPagamento: FormaPagamento; total: number }[];
};

export type MonthKey = { year: number; month: number };

export type MonthRange = {
  earliest: MonthKey | undefined;
  latest: MonthKey | undefined;
};

export type DayGroup<T> = { label: string; date: Date; rows: T[] };

export type InvoiceGroup = {
  cartaoNome: string;
  dataVencimento: Date;
  rows: ForecastRow[];
};

export type MonthOverview = {
  year: number;
  month: number;
  kind: 'atual' | 'passado' | 'futuro-previsto';
  breakdown: PaymentBreakdown;
  groupedByDay: DayGroup<PurchaseListRow>[] | null;
  groupedByInvoice: InvoiceGroup[] | null;
  range: MonthRange;
};
