export type Period = { start: Date; end: Date };

export type PeriodKind = 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL';

/**
 * Base de cálculo das Estatísticas (FR-003 da feature 003): `'minha'`
 * soma a parte do usuário (`valorResponsabilidade`); `'global'` soma o
 * valor cheio da parcela (`valor`), incluindo a parte de terceiros.
 */
export type SpendingBasis = 'minha' | 'global';

/**
 * Parcela com sua Compra associada já resolvida/joined pelo
 * repositório, já filtrada por período — `domain/statistics` nunca
 * consulta o banco (contracts/statistics.md).
 */
export type ParcelaComCompra = {
  parcelaId: string;
  /** Valor cheio da parcela — base `'global'`. */
  valor: number;
  /** Parte do usuário, já resolvida no write — base `'minha'`. */
  valorResponsabilidade: number;
  compra: {
    id: string;
    descricao: string;
    categoriaId: string | null;
    origem: 'MANUAL' | 'CSV_IMPORT' | 'ASSINATURA';
  };
};
