import { startOfDay } from 'date-fns';

export type InvoiceStatusInput = {
  pagaEm: Date | null;
  dataFechamento: Date;
};

/**
 * `FUTURA` nunca é retornada por esta função — é reatribuída depois,
 * por `demoteFutureOpenInvoices`, às faturas `ABERTA` de um cartão que
 * não são o ciclo com fechamento mais próximo (ex.: parcelas 2..N de
 * uma compra parcelada já alocam faturas de meses futuros, mas só a
 * mais próxima está de fato "em andamento").
 */
export type InvoiceStatus = 'ABERTA' | 'FECHADA' | 'PAGA' | 'FUTURA';

/**
 * Deriva o status de exibição de uma Fatura isoladamente (sem
 * comparar com as demais do mesmo cartão — ver `demoteFutureOpenInvoices`
 * para isso). Não persiste nada — a transição para `PAGA` só acontece
 * via ação explícita do usuário (repositório grava `pagaEm`);
 * `ABERTA`/`FECHADA` são sempre recalculados a partir da data atual,
 * nunca armazenados.
 */
export function computeInvoiceStatus(fatura: InvoiceStatusInput, today: Date): InvoiceStatus {
  if (fatura.pagaEm !== null) {
    return 'PAGA';
  }
  // `dataFechamento` é sempre meia-noite (`clampDayToMonth`) — comparar o
  // timestamp completo de `today` contra ela faria a fatura virar FECHADA
  // a partir de 00:00:01 do PRÓPRIO dia de fechamento, quando ele ainda
  // não terminou. Truncar `today` ao início do dia mantém ABERTA durante
  // todo o dia de fechamento, fechando só a partir do dia seguinte —
  // simétrico com `resolveInvoicePeriod`, que já trata esse dia como
  // parte do ciclo atual (bug real encontrado em teste no dispositivo).
  if (startOfDay(today) > fatura.dataFechamento) {
    return 'FECHADA';
  }
  return 'ABERTA';
}
