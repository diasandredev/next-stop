import React, { useEffect, useRef, useCallback } from 'react';
import { Card, ExtraColumn, Calendar, AccountSettings } from '@/types/kanban';
import { SyncProvider } from './SyncContext';
import { useKanbanData } from '@/hooks/kanban/useKanbanData';
import { useCardOperations } from '@/hooks/kanban/useCardOperations';
import { useCalendarOperations } from '@/hooks/kanban/useCalendarOperations';
import { KanbanContext } from './KanbanContext';

// Inner provider that manages Kanban state and interacts with SyncContext
const KanbanInnerProvider: React.FC<{ children: React.ReactNode; stateRef: React.MutableRefObject<any> }> = ({ children, stateRef }) => {
    const {
        cards, setCards,
        extraColumns, setExtraColumns,
        calendars, setCalendars,
        accountSettings, setAccountSettings,
        currentCalendarId, setCurrentCalendarId,
        isLoading, markDirty
    } = useKanbanData();

    // Update stateRef for SyncContext
    useEffect(() => {
        stateRef.current = {
            cards,
            extraColumns,
            calendars,
            accountSettings
        };
    }, [cards, extraColumns, calendars, accountSettings, stateRef]);

    const {
        addCard,
        updateCard,
        deleteCard,
        deleteAllCards
    } = useCardOperations({ setCards, currentCalendarId, markDirty });

    const {
        addCalendar,
        updateCalendar,
        deleteCalendar
    } = useCalendarOperations({
        calendars,
        setCalendars,
        currentCalendarId,
        setCurrentCalendarId,
        markDirty
    });

    const updateExtraColumn = useCallback((id: string, name: string) => {
        setExtraColumns(prev => prev.map(col => {
            if (col.id === id) {
                markDirty(col.id, 'extraColumns');
                return { ...col, name };
            }
            return col;
        }));
    }, [markDirty, setExtraColumns]);

    const updateAccountSettings = useCallback((settings: Partial<AccountSettings>) => {
        setAccountSettings(prev => {
            const newSettings = prev ? { ...prev, ...settings } : settings as AccountSettings;
            markDirty('settings', 'accountSettings');
            return newSettings;
        });
    }, [markDirty, setAccountSettings]);

    const addCustomColor = useCallback((color: string) => {
        setAccountSettings(prev => {
            const currentColors = prev?.customColors || [];
            if (currentColors.includes(color)) return prev;

            const newSettings = {
                ...prev,
                customColors: [...currentColors, color]
            } as AccountSettings;

            markDirty('settings', 'accountSettings');
            return newSettings;
        });
    }, [markDirty, setAccountSettings]);

    // Filtered data based on current calendar
    const filteredCards = cards.filter(c => {
        // If card has no calendarId, it belongs to default calendar (migration/legacy support)
        const cardCalendarId = c.calendarId || '1';
        return cardCalendarId === currentCalendarId;
    });

    const value = {
        cards: filteredCards,
        extraColumns,
        calendars,
        currentCalendarId,
        accountSettings,
        isLoading,
        addCard,
        updateCard,
        deleteCard,
        deleteAllCards,
        updateExtraColumn,
        addCalendar,
        updateCalendar,
        deleteCalendar,
        setCurrentCalendarId,

        updateAccountSettings,
        addCustomColor,
        setCards
    };

    return (
        <KanbanContext.Provider value={value}>
            {children}
        </KanbanContext.Provider>
    );
};

// Outer KanbanProvider that wraps SyncProvider
export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // This ref will hold the current state of all Kanban data for the SyncProvider
    const kanbanStateRef = useRef<{
        cards: Card[];
        extraColumns: ExtraColumn[];
        calendars: Calendar[];
        accountSettings: AccountSettings | null;
    }>({
        cards: [],
        extraColumns: [],
        calendars: [],
        accountSettings: null,
    });

    // This function will be passed to SyncProvider to get the latest state
    const getKanbanStateForSync = useCallback(() => kanbanStateRef.current, []);

    return (
        <SyncProvider getState={getKanbanStateForSync}>
            <KanbanInnerProvider stateRef={kanbanStateRef}>
                {children}
            </KanbanInnerProvider>
        </SyncProvider>
    );
};
