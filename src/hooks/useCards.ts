import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  archiveCard,
  type Card,
  type CardInput,
  createCard,
  getCard,
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

  // useEffect só roda de novo se as deps mudarem — mas o React Navigation
  // mantém a tela de trás MONTADA na pilha, então voltar de "Novo cartão"
  // não remonta "Cartões · Main" e um simples useEffect nunca refaz o
  // fetch. useFocusEffect roda de novo toda vez que a tela recebe foco
  // (inclusive ao voltar de outra tela), que é exatamente o gatilho certo
  // aqui.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

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

/** Um único cartão (nome/dia de fechamento/vencimento) — usado por telas que dependem de um `cardId` de rota. */
export function useCard(cardId: string | undefined) {
  const [card, setCard] = useState<Card>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!cardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setCard(await getCard(cardId));
    setLoading(false);
  }, [cardId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { card, loading, refresh };
}
