import React, { useEffect, useRef, useCallback } from 'react';
import { Card, ExtraColumn, Trip, Dashboard, AccountSettings } from '@/types/kanban';
import { SyncProvider } from './SyncContext';
import { useKanbanData } from '@/hooks/kanban/useKanbanData';
import { useCardOperations } from '@/hooks/kanban/useCardOperations';
import { useTripOperations } from '@/hooks/kanban/useTripOperations';
import { useDashboardOperations } from '@/hooks/kanban/useDashboardOperations';
import { KanbanContext } from './KanbanContext';

// Inner provider that manages Kanban state and interacts with SyncContext
const KanbanInnerProvider: React.FC<{ children: React.ReactNode; stateRef: React.MutableRefObject<any> }> = ({ children, stateRef }) => {
    const {
        cards, setCards,
        extraColumns, setExtraColumns,
        trips, setTrips,
        dashboards, setDashboards,
        accountSettings, setAccountSettings,
        currentTripId, setCurrentTripId,
        isLoading, markDirty
    } = useKanbanData();

    // Update stateRef for SyncContext
    useEffect(() => {
        stateRef.current = {
            cards,
            extraColumns,
            trips,
            dashboards,
            accountSettings
        };
    }, [cards, extraColumns, trips, dashboards, accountSettings, stateRef]);

    const {
        addCard,
        updateCard,
        deleteCard,
        deleteAllCards
    } = useCardOperations({ setCards, markDirty });

    const {
        addTrip,
        updateTrip,
        deleteTrip
    } = useTripOperations({
        setTrips,
        currentTripId,
        setCurrentTripId,
        markDirty
    });

    const {
        addDashboard,
        updateDashboard,
        deleteDashboard
    } = useDashboardOperations({
        dashboards,
        setDashboards,
        markDirty,
        timezone: accountSettings?.timezone
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

    const value = {
        cards,
        extraColumns,
        trips,
        dashboards,
        currentTripId,
        accountSettings,
        isLoading,

        addCard,
        updateCard,
        deleteCard,
        deleteAllCards,

        updateExtraColumn,

        addTrip,
        updateTrip,
        deleteTrip,
        setCurrentTripId,

        addDashboard,
        updateDashboard,
        deleteDashboard,

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
        trips: Trip[];
        dashboards: Dashboard[];
        accountSettings: AccountSettings | null;
    }>({
        cards: [],
        extraColumns: [],
        trips: [],
        dashboards: [],
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
