/**
 * Tipos derivados da tela Compras (`data-model.md` da feature
 * 002-central-de-compras) — nunca persistidos, sempre recalculados a
 * partir de `Compra`/`Parcela`/`Fatura` já existentes.
 */

export type FormaPagamento = 'CARTAO' | 'PIX';

/**
 * Uma linha de lista — a unidade é a Parcela, não a Compra (ver
 * `contracts/purchases-overview.md`): uma compra parcelada em 4x gera
 * 4 `PurchaseListRow`, uma por mês, cada uma com seu próprio
 * `parcelaId`.
 */
export type PurchaseListRow = {
  parcelaId: string;
  compraId: string;
  descricao: string;
  categoria: { icone: string; nome: string } | null;
  /** Valor desta parcela/ocorrência — não o total original quando parcelado. */
  valor: number;
  formaPagamento: FormaPagamento;
  /** Presente apenas quando `formaPagamento = 'CARTAO'`. */
  nomeCartao: string | null;
  /** Presente apenas quando `Compra.parcelasTotal > 1`. */
  parcela: { atual: number; total: number } | null;
  /**
   * O "dia" desta parcela para agrupamento: `Compra.dataCompra` quando
   * Pix; `Fatura.dataVencimento` quando cartão — não é sempre a data
   * original da compra.
   */
  dataCompra: Date;
};

export type PaymentBreakdown = {
  total: number;
  porFormaPagamento: { formaPagamento: FormaPagamento; total: number }[];
};

export type MonthKey = { year: number; month: number };

export type MonthRange = {
  earliest: MonthKey | undefined;
  latest: MonthKey | undefined;
};

export type DayGroup = { label: string; rows: PurchaseListRow[] };

export type InvoiceGroup = {
  cartaoNome: string;
  dataVencimento: Date;
  rows: PurchaseListRow[];
};

export type MonthOverview = {
  year: number;
  month: number;
  kind: 'atual' | 'passado' | 'futuro-previsto';
  breakdown: PaymentBreakdown;
  groupedByDay: DayGroup[] | null;
  groupedByInvoice: InvoiceGroup[] | null;
  range: MonthRange;
};
