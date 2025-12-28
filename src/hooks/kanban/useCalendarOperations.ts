import { useCallback } from 'react';
import { Calendar } from '@/types/kanban';

interface UseCalendarOperationsProps {
    calendars: Calendar[];
    setCalendars: React.Dispatch<React.SetStateAction<Calendar[]>>;
    currentCalendarId: string;
    setCurrentCalendarId: React.Dispatch<React.SetStateAction<string>>;
    markDirty: (id: string, type: 'cards' | 'extraColumns' | 'recurringTasks' | 'calendars' | 'accountSettings') => void;
}

export const useCalendarOperations = ({
    setCalendars,
    currentCalendarId,
    setCurrentCalendarId,
    markDirty
}: UseCalendarOperationsProps) => {

    const addCalendar = useCallback((name: string) => {
        const newCalendar: Calendar = { id: crypto.randomUUID(), name };
        setCalendars(prev => [...prev, newCalendar]);
        markDirty(newCalendar.id, 'calendars');
    }, [markDirty, setCalendars]);

    const updateCalendar = useCallback((id: string, updates: Partial<Calendar>) => {
        setCalendars(prev => prev.map(cal => {
            if (cal.id === id) {
                markDirty(id, 'calendars');
                return { ...cal, ...updates };
            }
            return cal;
        }));
    }, [markDirty, setCalendars]);

    const deleteCalendar = useCallback((id: string) => {
        setCalendars(prev => prev.filter(c => c.id !== id));
        markDirty(id, 'calendars');
        if (currentCalendarId === id) {
            setCurrentCalendarId('1');
        }
    }, [currentCalendarId, markDirty, setCalendars, setCurrentCalendarId]);

    return {
        addCalendar,
        updateCalendar,
        deleteCalendar,
        setCurrentCalendarId
    };
};
