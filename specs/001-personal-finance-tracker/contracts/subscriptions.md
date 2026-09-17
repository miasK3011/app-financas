# Contrato: `domain/subscriptions`

## `pendingChargesFor(subscriptions: Assinatura[], existingGenerated: { assinaturaId: string; year: number; month: number }[], today: Date): PendingCharge[]`

`PendingCharge = { assinaturaId: string; year: number; month: number; chargeDate: Date }`

- Roda a cada abertura do app (chamada a partir de `app/_layout.tsx` ou da tela de Início/Assinaturas,
  antes de renderizar seus dados).
- Para cada Assinatura ativa (`canceladaEm === null`) cujo `dataInicio ≤ today`: calcula o dia de
  cobrança do mês corrente (clamp de mês curto — mesma regra de Cartão) e, se
  `today ≥ chargeDate` **e** não existe já um item em `existingGenerated` para
  `(assinaturaId, year, month)` do mês corrente, inclui no retorno.
- É puramente funcional — não escreve nada. O repositório consumidor é quem, para cada
  `PendingCharge` retornado, cria a Compra (`origem = ASSINATURA`, copiando forma de pagamento,
  cartão, categoria e tags **vigentes agora** da Assinatura) e sua única Parcela, garantindo a
  idempotência via a mesma chave `(assinaturaId, year, month)` (FR-017, seção "Geração mensal
  idempotente" do `data-model.md`).

## `monthlySubscriptionsTotal(subscriptions: Assinatura[]): number`

Soma `valor` de todas as Assinaturas ativas — usado pela tela de Assinaturas (FR-018) e por
`domain/statistics` (percentual comprometido com assinaturas, FR-045).
