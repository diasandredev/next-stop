import { useCallback } from 'react';
import { Card } from '@/types/kanban';

interface UseCardOperationsProps {
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    currentCalendarId: string;
    markDirty: (id: string, type: 'cards' | 'extraColumns' | 'recurringTasks' | 'calendars' | 'accountSettings') => void;
}

export const useCardOperations = ({ setCards, currentCalendarId, markDirty }: UseCardOperationsProps) => {
    const addCard = useCallback((cardData: Omit<Card, 'id' | 'createdAt'>) => {
        const newCard: Card = {
            ...cardData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            calendarId: currentCalendarId,
        };
        setCards(prev => [...prev, newCard]);
        markDirty(newCard.id, 'cards');
    }, [currentCalendarId, markDirty, setCards]);

    const updateCard = useCallback((id: string, updates: Partial<Card>) => {
        setCards(prev => prev.map(card => {
            if (card.id === id) {
                const updated = { ...card, ...updates };
                markDirty(id, 'cards');
                return updated;
            }
            return card;
        }));
    }, [markDirty, setCards]);

    const deleteCard = useCallback((id: string) => {
        setCards(prev => prev.filter(c => c.id !== id));
        markDirty(id, 'cards');
    }, [markDirty, setCards]);

    const deleteAllCards = useCallback(() => {
        setCards(prev => {
            prev.forEach(c => markDirty(c.id, 'cards'));
            return [];
        });
    }, [markDirty, setCards]);

    return {
        addCard,
        updateCard,
        deleteCard,
        deleteAllCards
    };
};
