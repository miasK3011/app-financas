/** Pronto para virar Compra — ainda sem id/cartaoId/loteImportacaoId (contracts/csv-import.md). */
export type CompraDraft = {
  descricao: string;
  valorTotalOriginal: number; // centavos — pode ser negativo (estorno/crédito do Nubank)
  dataCompra: Date;
  parcelasTotal: number; // 1 quando não detectado padrão de parcela
  parcelaAtual: number; // 1 quando não detectado padrão de parcela
};

export type SkippedRow = {
  rawLine: string;
  reason: string;
};

export type CsvParseResult = {
  imported: CompraDraft[];
  skipped: SkippedRow[]; // FR-026 — reportado ao usuário, nunca interrompe a importação
};
