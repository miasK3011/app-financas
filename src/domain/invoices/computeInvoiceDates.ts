import { clampDayToMonth } from '@/domain/shared/dateClamp';

/**
 * Calcula as datas de fechamento e vencimento de uma Fatura para um
 * (ano, mês) de referência específico.
 *
 * Correção em relação a `contracts/invoices.md` (que descrevia um único
 * `ensureInvoice` fazendo tanto o cálculo quanto o upsert no banco):
 * essa função é a parte PURA e testável do cálculo — sem acesso a
 * banco — enquanto `repositories/invoicesRepository.getOrCreateInvoice`
 * é quem de fato lê/insere a linha, chamando esta função apenas quando
 * precisa criar uma Fatura nova. Mantém `domain/` livre de Drizzle,
 * conforme `plan.md` e `research.md` — Estratégia de testes.
 *
 * Regra de vencimento (não explicitada em `data-model.md`, decidida
 * aqui): quando `diaVencimento >= diaFechamento`, o vencimento cai no
 * MESMO mês do fechamento (ex.: fecha dia 10, vence dia 17 — caso da
 * User Story 1). Quando `diaVencimento < diaFechamento`, o vencimento
 * cai no mês SEGUINTE (padrão comum de cartão real: fecha perto do fim
 * do mês, vence no início do mês seguinte).
 */
export function computeInvoiceDates(
  card: { diaFechamento: number; diaVencimento: number },
  year: number,
  month: number,
): { dataFechamento: Date; dataVencimento: Date } {
  const dataFechamento = clampDayToMonth(card.diaFechamento, year, month);

  const dataVencimento =
    card.diaVencimento >= card.diaFechamento
      ? clampDayToMonth(card.diaVencimento, year, month)
      : month === 12
        ? clampDayToMonth(card.diaVencimento, year + 1, 1)
        : clampDayToMonth(card.diaVencimento, year, month + 1);

  return { dataFechamento, dataVencimento };
}
