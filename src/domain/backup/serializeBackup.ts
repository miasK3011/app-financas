import { z } from 'zod';

/**
 * Versão do formato do arquivo de backup em si (não a versão da
 * migration do Drizzle) — incrementa só quando o SHAPE do JSON muda de
 * forma incompatível. `SUPPORTED_SCHEMA_VERSIONS` é a lista de versões
 * que `validateBackupFile` ainda sabe ler.
 */
export const CURRENT_SCHEMA_VERSION = 1;
const SUPPORTED_SCHEMA_VERSIONS = [1];

const categoriaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  icone: z.string(),
  predefinida: z.boolean(),
});

const cartaoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  diaFechamento: z.number(),
  diaVencimento: z.number(),
  arquivadoEm: z.coerce.date().nullable(),
  criadoEm: z.coerce.date(),
});

const estabelecimentoSchema = z.object({
  id: z.string(),
  nomeExibicao: z.string(),
  iconeRespaldo: z.string(),
  dominio: z.string().nullable(),
  logoCachePath: z.string().nullable(),
  criadoEm: z.coerce.date(),
});

const padraoReconhecimentoSchema = z.object({
  id: z.string(),
  estabelecimentoId: z.string(),
  texto: z.string(),
});

const tagSchema = z.object({ id: z.string(), nome: z.string() });

const reservaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  taxaRendimentoMensalPercentual: z.number().nullable(),
  arquivadoEm: z.coerce.date().nullable(),
});

const lancamentoReservaSchema = z.object({
  id: z.string(),
  reservaId: z.string(),
  tipo: z.enum(['DEPOSITO', 'RETIRADA', 'RENDIMENTO_MANUAL', 'RENDIMENTO_AUTOMATICO']),
  valor: z.number(),
  data: z.coerce.date(),
  observacao: z.string().nullable(),
});

const configuracaoRendaSchema = z.object({
  id: z.string(),
  valor: z.number(),
  vigenteDesde: z.coerce.date(),
});

const metaConsumoIdealSchema = z.object({
  id: z.string(),
  percentualDaRenda: z.number(),
});

const faturaSchema = z.object({
  id: z.string(),
  cartaoId: z.string(),
  referenciaAno: z.number(),
  referenciaMes: z.number(),
  dataFechamento: z.coerce.date(),
  dataVencimento: z.coerce.date(),
  status: z.enum(['ABERTA', 'FECHADA', 'PAGA']),
  pagaEm: z.coerce.date().nullable(),
});

const loteImportacaoSchema = z.object({
  id: z.string(),
  cartaoId: z.string(),
  formato: z.enum(['GENERICO', 'NUBANK']),
  importadoEm: z.coerce.date(),
  nomeArquivo: z.string(),
  totalLinhas: z.number(),
  linhasImportadas: z.number(),
  linhasIgnoradas: z.number(),
});

const assinaturaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  valor: z.number(),
  formaPagamento: z.enum(['PIX', 'CARTAO']),
  cartaoId: z.string().nullable(),
  diaCobranca: z.number(),
  dataInicio: z.coerce.date(),
  canceladaEm: z.coerce.date().nullable(),
  categoriaId: z.string().nullable(),
});

const assinaturaTagSchema = z.object({ assinaturaId: z.string(), tagId: z.string() });

const compraSchema = z.object({
  id: z.string(),
  descricao: z.string(),
  valorTotalOriginal: z.number(),
  dataCompra: z.coerce.date(),
  formaPagamento: z.enum(['PIX', 'CARTAO']),
  cartaoId: z.string().nullable(),
  parcelasTotal: z.number(),
  parcelaAtual: z.number(),
  comentario: z.string().nullable(),
  categoriaId: z.string().nullable(),
  estabelecimentoId: z.string().nullable(),
  estabelecimentoManual: z.boolean(),
  valorResponsabilidade: z.number().nullable(),
  motivo: z.string().nullable(),
  responsavel: z.string().nullable(),
  origem: z.enum(['MANUAL', 'CSV_IMPORT', 'ASSINATURA']),
  assinaturaId: z.string().nullable(),
  loteImportacaoId: z.string().nullable(),
  criadoEm: z.coerce.date(),
});

const compraTagSchema = z.object({ compraId: z.string(), tagId: z.string() });

const parcelaSchema = z.object({
  id: z.string(),
  compraId: z.string(),
  faturaId: z.string().nullable(),
  numero: z.number(),
  valor: z.number(),
  valorResponsabilidade: z.number(),
});

const entradaAvulsaSchema = z.object({
  id: z.string(),
  descricao: z.string(),
  valor: z.number(),
  data: z.coerce.date(),
  compraVinculadaId: z.string().nullable(),
});

const backupDataSchema = z.object({
  cartoes: z.array(cartaoSchema),
  faturas: z.array(faturaSchema),
  compras: z.array(compraSchema),
  parcelas: z.array(parcelaSchema),
  tags: z.array(tagSchema),
  compraTags: z.array(compraTagSchema),
  assinaturas: z.array(assinaturaSchema),
  assinaturaTags: z.array(assinaturaTagSchema),
  configuracoesRenda: z.array(configuracaoRendaSchema),
  entradasAvulsas: z.array(entradaAvulsaSchema),
  reservas: z.array(reservaSchema),
  lancamentosReserva: z.array(lancamentoReservaSchema),
  lotesImportacao: z.array(loteImportacaoSchema),
  categorias: z.array(categoriaSchema),
  estabelecimentos: z.array(estabelecimentoSchema),
  padroesReconhecimento: z.array(padraoReconhecimentoSchema),
  metaConsumoIdeal: metaConsumoIdealSchema.nullable(),
});

export const backupFileSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  data: backupDataSchema,
});

export type BackupFile = z.infer<typeof backupFileSchema>;
export type FullDataSnapshot = z.infer<typeof backupDataSchema>;

/** Pura: só monta o envelope — quem lê as 17 tabelas é `backupRepository.exportAll` (T062). */
export function serializeBackup(allData: FullDataSnapshot): BackupFile {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: allData,
  };
}

export { SUPPORTED_SCHEMA_VERSIONS };
