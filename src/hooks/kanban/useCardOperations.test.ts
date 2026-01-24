import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCardOperations } from './useCardOperations';
import { Card } from '@/types/kanban';

describe('useCardOperations', () => {
    const mockSaveCard = vi.fn();
    const mockDeleteCard = vi.fn();
    const currentTripId = 'trip-1';
    const initialCards: Card[] = [
        { id: 'card-1', title: 'Card 1', createdAt: '2023-01-01' } as Card,
        { id: 'card-2', title: 'Card 2', createdAt: '2023-01-02' } as Card
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock crypto.randomUUID
        Object.defineProperty(global, 'crypto', {
            value: {
                randomUUID: () => 'test-uuid'
            },
            writable: true
        });
    });

    it('should add a card', () => {
        const { result } = renderHook(() => useCardOperations({
            cards: initialCards,
            userEmail: 'test@example.com',
            saveCard: mockSaveCard,
            deleteCard: mockDeleteCard,
            currentTripId
        }));

        const newCardData = { title: 'New Card', columnId: 'col1' } as unknown as Card;

        act(() => {
            result.current.addCard(newCardData);
        });

        expect(mockSaveCard).toHaveBeenCalledWith(currentTripId, expect.objectContaining({
            title: 'New Card',
            id: 'test-uuid',
            createdBy: 'test@example.com'
        }));
    });

    it('should update a card', () => {
        const { result } = renderHook(() => useCardOperations({
            cards: initialCards,
            userEmail: 'test@example.com',
            saveCard: mockSaveCard,
            deleteCard: mockDeleteCard,
            currentTripId
        }));

        act(() => {
            result.current.updateCard('card-1', { title: 'Updated Title' });
        });

        expect(mockSaveCard).toHaveBeenCalledWith(currentTripId, expect.objectContaining({
            id: 'card-1',
            title: 'Updated Title',
            lastEditedBy: 'test@example.com'
        }));
    });

    it('should delete a card', () => {
        const { result } = renderHook(() => useCardOperations({
            cards: initialCards,
            userEmail: 'test@example.com',
            saveCard: mockSaveCard,
            deleteCard: mockDeleteCard,
            currentTripId
        }));

        act(() => {
            result.current.deleteCard('card-1');
        });

        expect(mockDeleteCard).toHaveBeenCalledWith(currentTripId, 'card-1');
    });

    it('should delete all cards', () => {
        const { result } = renderHook(() => useCardOperations({
            cards: initialCards,
            userEmail: 'test@example.com',
            saveCard: mockSaveCard,
            deleteCard: mockDeleteCard,
            currentTripId
        }));

        act(() => {
            result.current.deleteAllCards();
        });

        expect(mockDeleteCard).toHaveBeenCalledTimes(2);
        expect(mockDeleteCard).toHaveBeenCalledWith(currentTripId, 'card-1');
        expect(mockDeleteCard).toHaveBeenCalledWith(currentTripId, 'card-2');
    });
});
