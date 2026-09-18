export type EstablishmentPattern = {
  estabelecimentoId: string;
  texto: string;
  estabelecimentoCriadoEm: Date;
};

/**
 * FR-033: casa `description` contra cada padrão por "contém"
 * case-insensitive. Múltiplos matches (Edge Case) — desempate
 * determinístico: (1) padrão mais longo vence; (2) empate de tamanho
 * → Estabelecimento com `criadoEm` mais antigo vence (Assumption).
 */
export function matchEstablishment(
  description: string,
  patterns: EstablishmentPattern[],
): string | null {
  const lowerDescription = description.toLowerCase();
  const matches = patterns.filter((pattern) =>
    lowerDescription.includes(pattern.texto.toLowerCase()),
  );
  if (matches.length === 0) return null;

  const best = matches.reduce((best, current) => {
    if (current.texto.length !== best.texto.length) {
      return current.texto.length > best.texto.length ? current : best;
    }
    return current.estabelecimentoCriadoEm.getTime() < best.estabelecimentoCriadoEm.getTime()
      ? current
      : best;
  });

  return best.estabelecimentoId;
}
