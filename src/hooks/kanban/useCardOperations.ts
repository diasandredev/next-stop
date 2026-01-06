import { useCallback } from 'react';
import { Card } from '@/types/kanban';

interface UseCardOperationsProps {
    cards: Card[];
    setCards?: React.Dispatch<React.SetStateAction<Card[]>>; // Deprecated
    userEmail?: string | null;
    saveCard: (tripId: string, card: Card) => Promise<void>;
    deleteCard: (tripId: string, cardId: string) => Promise<void>;
    currentTripId: string;
}

export const useCardOperations = ({ cards, userEmail, saveCard, deleteCard: deleteCardOp, currentTripId }: Omit<UseCardOperationsProps, 'currentCalendarId'>) => {
    const addCard = useCallback((cardData: Omit<Card, 'id' | 'createdAt'>) => {
        const newCard: Card = {
            ...cardData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            createdBy: userEmail || undefined,
        };
        saveCard(currentTripId, newCard);
    }, [saveCard, currentTripId, userEmail]);

    const updateCard = useCallback((id: string, updates: Partial<Card>) => {
        const card = cards.find(c => c.id === id);
        if (card) {
            const updated = {
                ...card,
                ...updates,
                lastEditedBy: userEmail || undefined,
                lastEditedAt: new Date().toISOString(),
            };
            saveCard(currentTripId, updated);
        }
    }, [saveCard, currentTripId, userEmail, cards]);

    const deleteCard = useCallback((id: string) => {
        deleteCardOp(currentTripId, id);
    }, [deleteCardOp, currentTripId]);

    const deleteAllCards = useCallback(() => {
        cards.forEach(c => deleteCardOp(currentTripId, c.id));
    }, [deleteCardOp, currentTripId, cards]);

    return {
        addCard,
        updateCard,
        deleteCard,
        deleteAllCards
    };
};

