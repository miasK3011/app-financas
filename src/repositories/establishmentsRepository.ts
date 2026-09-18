import { eq, inArray, isNull } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { z } from 'zod';

import { db } from '@/db/client';
import { compras, estabelecimentos, padroesReconhecimento } from '@/db/schema';
import { matchEstablishment } from '@/domain/establishmentMatching/matchEstablishment';
import { reevaluateUnassignedTransactions } from '@/domain/establishmentMatching/reevaluateUnassignedTransactions';

export type Establishment = typeof estabelecimentos.$inferSelect;
export type RecognitionPattern = typeof padroesReconhecimento.$inferSelect;

export const establishmentInputSchema = z.object({
  nomeExibicao: z.string().min(1),
  iconeRespaldo: z.string().min(1),
  dominio: z.string().optional(),
});

export type EstablishmentInput = z.infer<typeof establishmentInputSchema>;

export async function createEstablishment(input: EstablishmentInput): Promise<Establishment> {
  const parsed = establishmentInputSchema.parse(input);
  const [establishment] = await db
    .insert(estabelecimentos)
    .values({
      id: randomUUID(),
      nomeExibicao: parsed.nomeExibicao,
      iconeRespaldo: parsed.iconeRespaldo,
      dominio: parsed.dominio ?? null,
      logoCachePath: null,
      criadoEm: new Date(),
    })
    .returning();
  return establishment;
}

export type UpdateEstablishmentInput = {
  nomeExibicao?: string;
  iconeRespaldo?: string;
  dominio?: string | null;
};

export async function updateEstablishment(
  id: string,
  updates: UpdateEstablishmentInput,
): Promise<void> {
  await db.update(estabelecimentos).set(updates).where(eq(estabelecimentos.id, id));
}

export async function listEstablishments(): Promise<Establishment[]> {
  return db.select().from(estabelecimentos);
}

export type EstablishmentWithPatternCount = Establishment & { patternCount: number };

/** Para a lista de Estabelecimentos (T118) — quantidade de padrões cadastrados de cada um. */
export async function listEstablishmentsWithPatternCount(): Promise<
  EstablishmentWithPatternCount[]
> {
  const [establishmentsList, patterns] = await Promise.all([
    listEstablishments(),
    db.select().from(padroesReconhecimento),
  ]);

  return establishmentsList.map((establishment) => ({
    ...establishment,
    patternCount: patterns.filter((pattern) => pattern.estabelecimentoId === establishment.id)
      .length,
  }));
}

export async function getEstablishment(id: string): Promise<Establishment | undefined> {
  const [establishment] = await db
    .select()
    .from(estabelecimentos)
    .where(eq(estabelecimentos.id, id));
  return establishment;
}

export async function listPatternsForEstablishment(
  establishmentId: string,
): Promise<RecognitionPattern[]> {
  return db
    .select()
    .from(padroesReconhecimento)
    .where(eq(padroesReconhecimento.estabelecimentoId, establishmentId));
}

/**
 * FR-033: casa uma descrição contra TODOS os padrões cadastrados —
 * usada por `purchasesRepository`/`csvImportRepository` ao criar uma
 * Compra nova (matching automático).
 */
export async function matchEstablishmentForDescription(descricao: string): Promise<string | null> {
  const rows = await db
    .select({
      estabelecimentoId: padroesReconhecimento.estabelecimentoId,
      texto: padroesReconhecimento.texto,
      estabelecimentoCriadoEm: estabelecimentos.criadoEm,
    })
    .from(padroesReconhecimento)
    .innerJoin(estabelecimentos, eq(padroesReconhecimento.estabelecimentoId, estabelecimentos.id));

  return matchEstablishment(descricao, rows);
}

/**
 * FR-035: aplica um Padrão recém-criado às Compras ainda sem
 * Estabelecimento nenhum — nunca sobrescreve uma associação manual
 * (candidatas já filtradas por `estabelecimentoId IS NULL`, então
 * `estabelecimentoManual` só entra como segunda defesa via o próprio
 * domínio — FR-034).
 */
async function applyPatternToUnassignedTransactions(pattern: {
  texto: string;
  estabelecimentoId: string;
}): Promise<void> {
  const candidates = await db
    .select({
      id: compras.id,
      descricao: compras.descricao,
      estabelecimentoManual: compras.estabelecimentoManual,
    })
    .from(compras)
    .where(isNull(compras.estabelecimentoId));

  const matchingIds = reevaluateUnassignedTransactions(
    { texto: pattern.texto },
    candidates.map((row) => ({
      compraId: row.id,
      descricao: row.descricao,
      estabelecimentoManual: row.estabelecimentoManual,
    })),
  );

  if (matchingIds.length > 0) {
    await db
      .update(compras)
      .set({ estabelecimentoId: pattern.estabelecimentoId })
      .where(inArray(compras.id, matchingIds));
  }
}

/** FR-032/FR-035: cria o Padrão e retroatribui automaticamente as Compras elegíveis. */
export async function addPattern(
  establishmentId: string,
  texto: string,
): Promise<RecognitionPattern> {
  const [pattern] = await db
    .insert(padroesReconhecimento)
    .values({ id: randomUUID(), estabelecimentoId: establishmentId, texto })
    .returning();

  await applyPatternToUnassignedTransactions({ texto, estabelecimentoId: establishmentId });
  return pattern;
}

export async function deletePattern(id: string): Promise<void> {
  await db.delete(padroesReconhecimento).where(eq(padroesReconhecimento.id, id));
}

const LOGO_FETCH_TIMEOUT_MS = 5000;

/**
 * FR-036/Princípio I: busca best-effort do logotipo via Brandfetch CDN
 * — falha, timeout ou offline nunca bloqueiam nem lançam, apenas
 * mantêm `logoCachePath = null` (o app recai no `iconeRespaldo`).
 * Chamada de forma "fire and forget" pela tela de Estabelecimento, sem
 * travar o salvamento.
 */
export async function fetchAndCacheLogo(establishmentId: string, dominio: string): Promise<void> {
  try {
    const destinationDir = new Directory(Paths.cache, 'logos');
    if (!destinationDir.exists) destinationDir.create({ intermediates: true });

    const download = File.downloadFileAsync(`https://cdn.brandfetch.io/${dominio}`, destinationDir);
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), LOGO_FETCH_TIMEOUT_MS),
    );

    const file = await Promise.race([download, timeout]);
    if (!file) return;

    await db
      .update(estabelecimentos)
      .set({ logoCachePath: file.uri })
      .where(eq(estabelecimentos.id, establishmentId));
  } catch (error) {
    console.error('[estabelecimentos] falha ao buscar logotipo (best-effort, ignorada)', error);
  }
}
