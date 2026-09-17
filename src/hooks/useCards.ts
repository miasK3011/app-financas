import { useCallback, useEffect, useState } from 'react';

import {
  archiveCard,
  type Card,
  type CardInput,
  createCard,
  listActiveCards,
  listAllCards,
} from '@/repositories/cardsRepository';

/**
 * @param includeArchived Cartões · Main mantém histórico visível
 * (`true`); telas de nova compra e a sugestão de melhor cartão só
 * mostram cartões ativos (`false`, o padrão — FR-025).
 */
export function useCards(includeArchived = false) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setCards(await (includeArchived ? listAllCards() : listActiveCards()));
    setLoading(false);
  }, [includeArchived]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: CardInput) => {
      const card = await createCard(input);
      await refresh();
      return card;
    },
    [refresh],
  );

  const archive = useCallback(
    async (id: string) => {
      await archiveCard(id);
      await refresh();
    },
    [refresh],
  );

  return { cards, loading, refresh, create, archive };
}
