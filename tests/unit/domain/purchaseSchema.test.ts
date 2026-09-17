import { purchaseSchema } from '@/domain/shared/purchaseSchema';

const base = {
  descricao: 'Pizzaria Napoli',
  valorTotalOriginal: 7000,
  dataCompra: new Date('2026-09-05'),
  formaPagamento: 'CARTAO' as const,
  cartaoId: 'card-1',
  parcelasTotal: 3,
  parcelaAtual: 1,
};

describe('purchaseSchema', () => {
  it('accepts a valid installment purchase', () => {
    expect(purchaseSchema.safeParse(base).success).toBe(true);
  });

  it('rejects parcelaAtual greater than parcelasTotal (FR-005)', () => {
    const result = purchaseSchema.safeParse({ ...base, parcelasTotal: 6, parcelaAtual: 8 });
    expect(result.success).toBe(false);
  });

  it('rejects a CARTAO purchase without a cartaoId', () => {
    const result = purchaseSchema.safeParse({ ...base, cartaoId: undefined });
    expect(result.success).toBe(false);
  });

  it('accepts a PIX purchase without a cartaoId', () => {
    const result = purchaseSchema.safeParse({
      ...base,
      formaPagamento: 'PIX',
      cartaoId: undefined,
      parcelasTotal: 1,
      parcelaAtual: 1,
    });
    expect(result.success).toBe(true);
  });
});
