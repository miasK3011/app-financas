import { Text, XStack } from 'tamagui';

import type { InvoiceStatus } from '@/domain/invoices/computeInvoiceStatus';

const LABELS: Record<InvoiceStatus, string> = {
  ABERTA: 'Aberta',
  FECHADA: 'Fechada',
  PAGA: 'Paga',
  FUTURA: 'Futura',
};

// "Aberta" precisa de uma cor visualmente distinta de "Paga"/"Fechada"
// (feedback de design: os rótulos não eram distinguíveis o bastante).
// "Futura" usa o mesmo cinza neutro de "Fechada", mas isso é
// intencional: ambas não pesam no gasto "em aberto".
const COLORS: Record<InvoiceStatus, { bg: string; fg: string }> = {
  ABERTA: { bg: '$infoBg', fg: '$infoDark' },
  FECHADA: { bg: '$border', fg: '$textSecondary' },
  PAGA: { bg: '$successBg', fg: '$successDark' },
  FUTURA: { bg: '$border', fg: '$textTertiary' },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { bg, fg } = COLORS[status];
  return (
    <XStack backgroundColor={bg} borderRadius={999} paddingHorizontal="$2" paddingVertical="$1">
      <Text fontSize={11} fontWeight="700" color={fg}>
        {LABELS[status]}
      </Text>
    </XStack>
  );
}
