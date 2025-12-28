import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKanbanData } from './useKanbanData';
import { useSync } from '../../contexts/SyncContext';

// Mock SyncContext
vi.mock('../../contexts/SyncContext', () => ({
    useSync: vi.fn(),
}));

describe('useKanbanData', () => {
    const mockMarkDirty = vi.fn();
    const mockInitialFetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useSync as any).mockReturnValue({
            markDirty: mockMarkDirty,
            initialFetch: mockInitialFetch,
        });
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with default values when localStorage is empty', async () => {
        mockInitialFetch.mockResolvedValue(null);

        const { result } = renderHook(() => useKanbanData());

        expect(result.current.cards).toEqual([]);
        expect(result.current.extraColumns).toHaveLength(3); // Default columns
        expect(result.current.recurringTasks).toEqual([]);
        expect(result.current.calendars).toHaveLength(1); // Default calendar
        expect(result.current.currentCalendarId).toBe('1');
        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should load data from localStorage if available', () => {
        const mockCards = [{ id: '1', title: 'Test Card' }];
        localStorage.setItem('kanban_cards', JSON.stringify(mockCards));

        const { result } = renderHook(() => useKanbanData());

        expect(result.current.cards).toEqual(mockCards);
    });

    it('should fetch initial data from SyncContext', async () => {
        const mockData = {
            cards: [{ id: 'firebase-card', title: 'Firebase Card' }],
            extraColumns: [],
            recurringTasks: [],
            calendars: [],
            accountSettings: null,
        };
        mockInitialFetch.mockResolvedValue(mockData);

        const { result } = renderHook(() => useKanbanData());

        await waitFor(() => {
            expect(result.current.cards).toEqual(mockData.cards);
            expect(result.current.isLoading).toBe(false);
        });
    });

    it('should persist state changes to localStorage', async () => {
        mockInitialFetch.mockResolvedValue(null);
        const { result } = renderHook(() => useKanbanData());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const newCards = [{ id: 'new', title: 'New Card' }];

        // We need to wrap state updates in act, but renderHook handles it for simple cases usually.
        // However, since we are testing the effect of the state change on localStorage, we just check if the effect ran.
        // React 18 automatic batching might delay effects.

        // Directly setting state exposed by the hook
        await waitFor(() => {
            result.current.setCards(newCards as any);
        });

        expect(localStorage.getItem('kanban_cards')).toBe(JSON.stringify(newCards));
    });
});
