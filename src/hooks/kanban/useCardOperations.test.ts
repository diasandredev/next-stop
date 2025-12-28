import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCardOperations } from './useCardOperations';
import { Card } from '@/types/kanban';

describe('useCardOperations', () => {
    const mockSetCards = vi.fn();
    const mockMarkDirty = vi.fn();
    const currentCalendarId = 'calendar-1';

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock crypto.randomUUID
        Object.defineProperty(global, 'crypto', {
            value: {
                randomUUID: () => 'test-uuid'
            }
        });
    });

    it('should add a card', () => {
        const { result } = renderHook(() => useCardOperations({
            setCards: mockSetCards,
            currentCalendarId,
            markDirty: mockMarkDirty
        }));

        const newCardData = { title: 'New Card', columnId: 'col1' } as any;

        act(() => {
            result.current.addCard(newCardData);
        });

        expect(mockSetCards).toHaveBeenCalled();
        expect(mockMarkDirty).toHaveBeenCalledWith('test-uuid', 'cards');
    });

    it('should update a card', () => {
        const { result } = renderHook(() => useCardOperations({
            setCards: mockSetCards,
            currentCalendarId,
            markDirty: mockMarkDirty
        }));

        act(() => {
            result.current.updateCard('card-1', { title: 'Updated Title' });
        });

        expect(mockSetCards).toHaveBeenCalled();
        // We can't easily check the exact state update without a real state, 
        // but we can verify the setter was called.
    });

    it('should delete a card', () => {
        const { result } = renderHook(() => useCardOperations({
            setCards: mockSetCards,
            currentCalendarId,
            markDirty: mockMarkDirty
        }));

        act(() => {
            result.current.deleteCard('card-1');
        });

        expect(mockSetCards).toHaveBeenCalled();
        expect(mockMarkDirty).toHaveBeenCalledWith('card-1', 'cards');
    });

    it('should delete all cards', () => {
        const { result } = renderHook(() => useCardOperations({
            setCards: mockSetCards,
            currentCalendarId,
            markDirty: mockMarkDirty
        }));

        const cardsToDelete = [{ id: 'c1' }, { id: 'c2' }] as Card[];

        act(() => {
            result.current.deleteAllCards(cardsToDelete);
        });

        expect(mockMarkDirty).toHaveBeenCalledTimes(2);
        expect(mockSetCards).toHaveBeenCalledWith([]);
    });
});
