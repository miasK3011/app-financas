/**
 * FR-032: sugestão simples para a tela "Nova Compra · Criar
 * Estabelecimento" — `description` em maiúsculas, sem um sufixo final
 * de terminal/loja (ex.: `*38220SP`) nem pontuação/espaços residuais.
 * O usuário sempre pode editar antes de confirmar.
 */
export function suggestInitialPattern(description: string): string {
  return description
    .toUpperCase()
    .replace(/\*[A-Z0-9]*$/, '')
    .replace(/[^A-Z0-9À-Ú]+$/, '')
    .trim();
}
