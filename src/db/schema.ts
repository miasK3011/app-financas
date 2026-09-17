import { integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Valores monetários são sempre inteiros em centavos (evita erro de ponto
// flutuante em somas de fatura/saldo — FR-011, FR-015, SC-003). Datas são
// Unix timestamp em milissegundos. IDs são UUID v4 (expo-crypto).
// Ver specs/001-personal-finance-tracker/data-model.md para o contrato
// completo de cada tabela.

// ---------------------------------------------------------------------------
// Categoria (FR-027..FR-030, FR-037)
// ---------------------------------------------------------------------------
export const categorias = sqliteTable('categorias', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  icone: text('icone').notNull(),
  predefinida: integer('predefinida', { mode: 'boolean' }).notNull(),
});

// ---------------------------------------------------------------------------
// Cartão (FR-001, FR-002, FR-025)
// ---------------------------------------------------------------------------
export const cartoes = sqliteTable('cartoes', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  diaFechamento: integer('dia_fechamento').notNull(),
  diaVencimento: integer('dia_vencimento').notNull(),
  arquivadoEm: integer('arquivado_em', { mode: 'timestamp_ms' }),
  criadoEm: integer('criado_em', { mode: 'timestamp_ms' }).notNull(),
});

// ---------------------------------------------------------------------------
// Estabelecimento + Padrão de Reconhecimento (FR-031..FR-036)
// ---------------------------------------------------------------------------
export const estabelecimentos = sqliteTable('estabelecimentos', {
  id: text('id').primaryKey(),
  nomeExibicao: text('nome_exibicao').notNull(),
  iconeRespaldo: text('icone_respaldo').notNull(),
  dominio: text('dominio'),
  logoCachePath: text('logo_cache_path'),
  criadoEm: integer('criado_em', { mode: 'timestamp_ms' }).notNull(),
});

export const padroesReconhecimento = sqliteTable('padroes_reconhecimento', {
  id: text('id').primaryKey(),
  estabelecimentoId: text('estabelecimento_id')
    .notNull()
    .references(() => estabelecimentos.id),
  texto: text('texto').notNull(),
});

// ---------------------------------------------------------------------------
// Tag (FR-007, FR-008)
// ---------------------------------------------------------------------------
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey(),
    nome: text('nome').notNull(),
  },
  (t) => [uniqueIndex('tags_nome_unique').on(t.nome)],
);

// ---------------------------------------------------------------------------
// Reserva de Dinheiro Guardado + Lançamento de Reserva (FR-019..FR-021)
// ---------------------------------------------------------------------------
export const reservas = sqliteTable('reservas', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  taxaRendimentoMensalPercentual: real('taxa_rendimento_mensal_percentual'),
  arquivadoEm: integer('arquivado_em', { mode: 'timestamp_ms' }),
});

export const lancamentosReserva = sqliteTable('lancamentos_reserva', {
  id: text('id').primaryKey(),
  reservaId: text('reserva_id')
    .notNull()
    .references(() => reservas.id),
  tipo: text('tipo', {
    enum: ['DEPOSITO', 'RETIRADA', 'RENDIMENTO_MANUAL', 'RENDIMENTO_AUTOMATICO'],
  }).notNull(),
  valor: integer('valor').notNull(),
  data: integer('data', { mode: 'timestamp_ms' }).notNull(),
  observacao: text('observacao'),
});

// ---------------------------------------------------------------------------
// Configuração de Renda (FR-013)
// ---------------------------------------------------------------------------
export const configuracoesRenda = sqliteTable('configuracoes_renda', {
  id: text('id').primaryKey(),
  valor: integer('valor').notNull(),
  vigenteDesde: integer('vigente_desde', { mode: 'timestamp_ms' }).notNull(),
});

// ---------------------------------------------------------------------------
// Meta de Consumo Ideal — singleton (FR-042)
// ---------------------------------------------------------------------------
export const metaConsumoIdeal = sqliteTable('meta_consumo_ideal', {
  id: text('id').primaryKey(),
  percentualDaRenda: real('percentual_da_renda').notNull(),
});

// ---------------------------------------------------------------------------
// Fatura (FR-002, FR-011)
// ---------------------------------------------------------------------------
export const faturas = sqliteTable(
  'faturas',
  {
    id: text('id').primaryKey(),
    cartaoId: text('cartao_id')
      .notNull()
      .references(() => cartoes.id),
    referenciaAno: integer('referencia_ano').notNull(),
    referenciaMes: integer('referencia_mes').notNull(),
    dataFechamento: integer('data_fechamento', { mode: 'timestamp_ms' }).notNull(),
    dataVencimento: integer('data_vencimento', { mode: 'timestamp_ms' }).notNull(),
    // Só é escrita como 'ABERTA' (na criação) ou 'PAGA' (em markInvoiceAsPaid)
    // — a distinção de exibição ABERTA vs. FECHADA nunca lê esta coluna,
    // é sempre recalculada de `pagaEm`/`dataFechamento` via
    // domain/invoices/computeInvoiceStatus.ts, para nunca ficar desatualizada
    // conforme o tempo passa.
    status: text('status', { enum: ['ABERTA', 'FECHADA', 'PAGA'] }).notNull(),
    pagaEm: integer('paga_em', { mode: 'timestamp_ms' }),
  },
  (t) => [
    uniqueIndex('faturas_cartao_ano_mes_unique').on(t.cartaoId, t.referenciaAno, t.referenciaMes),
  ],
);

// ---------------------------------------------------------------------------
// Lote de Importação (FR-009, FR-010, FR-026)
// ---------------------------------------------------------------------------
export const lotesImportacao = sqliteTable('lotes_importacao', {
  id: text('id').primaryKey(),
  cartaoId: text('cartao_id')
    .notNull()
    .references(() => cartoes.id),
  formato: text('formato', { enum: ['GENERICO', 'NUBANK'] }).notNull(),
  importadoEm: integer('importado_em', { mode: 'timestamp_ms' }).notNull(),
  nomeArquivo: text('nome_arquivo').notNull(),
  totalLinhas: integer('total_linhas').notNull(),
  linhasImportadas: integer('linhas_importadas').notNull(),
  linhasIgnoradas: integer('linhas_ignoradas').notNull(),
});

// ---------------------------------------------------------------------------
// Assinatura + AssinaturaTag (FR-016..FR-018)
// ---------------------------------------------------------------------------
export const assinaturas = sqliteTable('assinaturas', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  valor: integer('valor').notNull(),
  formaPagamento: text('forma_pagamento', { enum: ['PIX', 'CARTAO'] }).notNull(),
  cartaoId: text('cartao_id').references(() => cartoes.id),
  diaCobranca: integer('dia_cobranca').notNull(),
  dataInicio: integer('data_inicio', { mode: 'timestamp_ms' }).notNull(),
  canceladaEm: integer('cancelada_em', { mode: 'timestamp_ms' }),
  categoriaId: text('categoria_id').references(() => categorias.id),
});

export const assinaturaTags = sqliteTable(
  'assinatura_tags',
  {
    assinaturaId: text('assinatura_id')
      .notNull()
      .references(() => assinaturas.id),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.assinaturaId, t.tagId] })],
);

// ---------------------------------------------------------------------------
// Compra (FR-003..FR-008, FR-046..FR-055 — User Story 12)
// ---------------------------------------------------------------------------
export const compras = sqliteTable('compras', {
  id: text('id').primaryKey(),
  descricao: text('descricao').notNull(),
  valorTotalOriginal: integer('valor_total_original').notNull(),
  dataCompra: integer('data_compra', { mode: 'timestamp_ms' }).notNull(),
  formaPagamento: text('forma_pagamento', { enum: ['PIX', 'CARTAO'] }).notNull(),
  cartaoId: text('cartao_id').references(() => cartoes.id),
  parcelasTotal: integer('parcelas_total').notNull().default(1),
  parcelaAtual: integer('parcela_atual').notNull().default(1),
  comentario: text('comentario'),
  categoriaId: text('categoria_id').references(() => categorias.id),
  estabelecimentoId: text('estabelecimento_id').references(() => estabelecimentos.id),
  estabelecimentoManual: integer('estabelecimento_manual', { mode: 'boolean' })
    .notNull()
    .default(false),
  valorResponsabilidade: integer('valor_responsabilidade'),
  motivo: text('motivo'),
  responsavel: text('responsavel'),
  origem: text('origem', { enum: ['MANUAL', 'CSV_IMPORT', 'ASSINATURA'] }).notNull(),
  assinaturaId: text('assinatura_id').references(() => assinaturas.id),
  loteImportacaoId: text('lote_importacao_id').references(() => lotesImportacao.id),
  criadoEm: integer('criado_em', { mode: 'timestamp_ms' }).notNull(),
});

export const compraTags = sqliteTable(
  'compra_tags',
  {
    compraId: text('compra_id')
      .notNull()
      .references(() => compras.id),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.compraId, t.tagId] })],
);

// ---------------------------------------------------------------------------
// Parcela (FR-004..FR-006, FR-055)
// ---------------------------------------------------------------------------
export const parcelas = sqliteTable('parcelas', {
  id: text('id').primaryKey(),
  compraId: text('compra_id')
    .notNull()
    .references(() => compras.id),
  // NULL quando a Compra é PIX — uma Parcela PIX não pertence a nenhuma
  // Fatura, entra direto no saldo do mês pela dataCompra (data-model.md).
  faturaId: text('fatura_id').references(() => faturas.id),
  numero: integer('numero').notNull(),
  valor: integer('valor').notNull(),
  valorResponsabilidade: integer('valor_responsabilidade').notNull(),
});

// ---------------------------------------------------------------------------
// Entrada Avulsa (FR-014, FR-050, FR-051)
// ---------------------------------------------------------------------------
export const entradasAvulsas = sqliteTable('entradas_avulsas', {
  id: text('id').primaryKey(),
  descricao: text('descricao').notNull(),
  valor: integer('valor').notNull(),
  data: integer('data', { mode: 'timestamp_ms' }).notNull(),
  compraVinculadaId: text('compra_vinculada_id').references(() => compras.id),
});
