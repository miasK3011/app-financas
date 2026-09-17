/**
 * Todo valor monetário no domínio é um inteiro em centavos (evita erro
 * de ponto flutuante em somas de fatura/saldo — FR-011, FR-015, SC-003).
 * Estas são as únicas conversões para/de reais no app.
 */

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

export function centsToReais(cents: number): number {
  return cents / 100;
}

export function formatBRL(cents: number): string {
  return centsToReais(cents).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
