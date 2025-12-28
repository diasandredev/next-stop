import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCalendarOperations } from './useCalendarOperations';


describe('useCalendarOperations', () => {
    const mockSetCalendars = vi.fn();
    const mockSetCurrentCalendarId = vi.fn();
    const mockMarkDirty = vi.fn();
    const currentCalendarId = 'calendar-1';

    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(global, 'crypto', {
            value: {
                randomUUID: () => 'test-uuid'
            }
        });
    });

    it('should add a calendar', () => {
        const { result } = renderHook(() => useCalendarOperations({
            calendars: [],
            setCalendars: mockSetCalendars,
            currentCalendarId,
            setCurrentCalendarId: mockSetCurrentCalendarId,
            markDirty: mockMarkDirty
        }));

        act(() => {
            result.current.addCalendar('New Calendar');
        });

        expect(mockSetCalendars).toHaveBeenCalled();
        expect(mockMarkDirty).toHaveBeenCalledWith('test-uuid', 'calendars');
    });

    it('should update a calendar', () => {
        const { result } = renderHook(() => useCalendarOperations({
            calendars: [],
            setCalendars: mockSetCalendars,
            currentCalendarId,
            setCurrentCalendarId: mockSetCurrentCalendarId,
            markDirty: mockMarkDirty
        }));

        act(() => {
            result.current.updateCalendar('c1', { name: 'Updated' });
        });

        expect(mockSetCalendars).toHaveBeenCalled();
        // Verification of update logic inside setter is harder without real state, 
        // but we verify the setter is called.
    });

    it('should delete a calendar', () => {
        const { result } = renderHook(() => useCalendarOperations({
            calendars: [],
            setCalendars: mockSetCalendars,
            currentCalendarId: 'c1',
            setCurrentCalendarId: mockSetCurrentCalendarId,
            markDirty: mockMarkDirty
        }));

        act(() => {
            result.current.deleteCalendar('c1');
        });

        expect(mockSetCalendars).toHaveBeenCalled();
        expect(mockMarkDirty).toHaveBeenCalledWith('c1', 'calendars');
        expect(mockSetCurrentCalendarId).toHaveBeenCalledWith('1');
    });
});
