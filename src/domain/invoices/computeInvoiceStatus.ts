export type InvoiceStatusInput = {
  pagaEm: Date | null;
  dataFechamento: Date;
};

export type InvoiceStatus = 'ABERTA' | 'FECHADA' | 'PAGA';

/**
 * Deriva o status de exibição de uma Fatura. Não persiste nada — a
 * transição para `PAGA` só acontece via ação explícita do usuário
 * (repositório grava `pagaEm`); `ABERTA`/`FECHADA` são sempre
 * recalculados a partir da data atual, nunca armazenados.
 */
export function computeInvoiceStatus(fatura: InvoiceStatusInput, today: Date): InvoiceStatus {
  if (fatura.pagaEm !== null) {
    return 'PAGA';
  }
  if (today > fatura.dataFechamento) {
    return 'FECHADA';
  }
  return 'ABERTA';
}
