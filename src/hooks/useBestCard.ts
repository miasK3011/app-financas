import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { type BestCardSuggestion, suggestBestCard } from '@/domain/bestCard/suggestBestCard';
import { listActiveCards } from '@/repositories/cardsRepository';

/** FR-012: sugestão de melhor cartão para comprar hoje, recalculada toda vez que a tela ganha foco. */
export function useBestCard() {
  const [suggestion, setSuggestion] = useState<BestCardSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const cards = await listActiveCards();
    setSuggestion(suggestBestCard(cards, new Date()));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { suggestion, loading, refresh };
}
