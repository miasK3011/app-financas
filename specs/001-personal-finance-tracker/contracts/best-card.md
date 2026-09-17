# Contrato: `domain/bestCard`

## `suggestBestCard(cards: Cartão[], today: Date): { cardId: string; dueDate: Date; daysUntilDue: number } | null`

- Filtra `cards` para excluir arquivados (`arquivadoEm !== null`) — FR-025.
- Para cada cartão restante, calcula `{ year, month } = invoices.resolveInvoicePeriod(card.diaFechamento, today)`
  e deriva a `dataVencimento` daquele ciclo (mesmo cálculo usado por `invoices.ensureInvoice`, sem
  precisar persistir nada aqui).
- Retorna o cartão cuja `dataVencimento` calculada é a **mais distante no futuro** a partir de
  `today` (maior prazo total até o pagamento — FR-012). Em caso de empate exato, retorna o primeiro
  por ordem de cadastro (`criadoEm` mais antigo) para ser determinístico.
- Retorna `null` quando não há nenhum cartão ativo (a UI trata como "cadastre um cartão para ver a
  sugestão").
