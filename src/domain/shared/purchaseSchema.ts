import { z } from 'zod';

/**
 * Validação estrutural de uma Compra, compartilhada entre o formulário
 * (Nova Compra / Editar Compra) e a importação de CSV — a mesma regra
 * nunca deve ser reimplementada em dois lugares.
 *
 * FR-005: a parcela atual não pode ser maior que o total de parcelas,
 * nem menor que 1. Regras específicas de User Story 12 (faixa de
 * `valorResponsabilidade`, FR-048) ficam em
 * `domain/expenseSplitting/validateManualResponsibility.ts` — não
 * duplicadas aqui.
 *
 * `valorTotalOriginal` aceita negativo: estornos/créditos importados
 * do CSV do Nubank viram Compras de valor negativo, que reduzem o
 * total da fatura ao somar (research.md § Formato do CSV do Nubank).
 * O formulário de Nova Compra nunca produz um valor negativo (o
 * `MoneyInput` só aceita dígitos), então a regra permissiva aqui não
 * afeta esse fluxo.
 */
export const purchaseSchema = z
  .object({
    descricao: z.string().min(1),
    valorTotalOriginal: z
      .number()
      .int()
      .refine((value) => value !== 0, 'Valor não pode ser zero'),
    dataCompra: z.date(),
    formaPagamento: z.enum(['PIX', 'CARTAO']),
    cartaoId: z.string().optional(),
    parcelasTotal: z.number().int().min(1).default(1),
    parcelaAtual: z.number().int().min(1).default(1),
  })
  .refine((data) => data.formaPagamento !== 'CARTAO' || Boolean(data.cartaoId), {
    message: 'Compras no cartão exigem um cartão selecionado',
    path: ['cartaoId'],
  })
  .refine((data) => data.parcelaAtual <= data.parcelasTotal, {
    message: 'A parcela atual não pode ser maior que o total de parcelas',
    path: ['parcelaAtual'],
  });

export type PurchaseInput = z.infer<typeof purchaseSchema>;
