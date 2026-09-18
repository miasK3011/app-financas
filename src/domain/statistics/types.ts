export type Period = { start: Date; end: Date };

export type PeriodKind = 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL';

/**
 * Parcela com sua Compra associada já resolvida/joined pelo
 * repositório, já filtrada por período — `domain/statistics` nunca
 * consulta o banco (contracts/statistics.md).
 */
export type ParcelaComCompra = {
  parcelaId: string;
  valorResponsabilidade: number;
  compra: {
    id: string;
    descricao: string;
    categoriaId: string | null;
    origem: 'MANUAL' | 'CSV_IMPORT' | 'ASSINATURA';
  };
};
