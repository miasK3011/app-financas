# Contrato: `domain/establishmentMatching`

## `matchEstablishment(description: string, patterns: { estabelecimentoId: string; texto: string; estabelecimentoCriadoEm: Date }[]): string | null`

- Filtra `patterns` cujo `texto` (case-insensitive) esteja contido em `description` (FR-033,
  Assumption de matching por substring).
- Sem nenhum match: retorna `null`.
- Um match: retorna o `estabelecimentoId`.
- Múltiplos matches (Edge Case): desempate determinístico — (1) maior `texto.length` vence; (2)
  empate de tamanho → menor `estabelecimentoCriadoEm` (mais antigo) vence.

## `reevaluateUnassignedTransactions(newPattern: { texto: string }, unassignedTransactions: { compraId: string; descricao: string; estabelecimentoManual: boolean }[]): string[]`

Chamado quando um Padrão de Reconhecimento é criado (novo Estabelecimento ou novo padrão em um
existente) — FR-035. Retorna os `compraId` que devem ser atualizados: apenas transações com
`estabelecimentoManual === false` (nunca sobrescreve uma associação manual — FR-034, Edge Case) e
cuja `descricao` contém `newPattern.texto` (case-insensitive).

## `suggestInitialPattern(description: string): string`

Usado pela tela "Nova Compra · Criar Estabelecimento" (criação inline a partir de uma transação já
registrada — FR-032). Sugestão simples: a `description` inteira, em maiúsculas, sem os caracteres
não-alfanuméricos finais comuns em descrições de fatura (ex.: sufixos numéricos de terminal/loja
tipo `*38220SP`) — o usuário sempre pode editar a sugestão antes de confirmar.
