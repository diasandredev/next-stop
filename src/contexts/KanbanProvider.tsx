import React, { useEffect, useRef, useCallback } from 'react';
import { Card, Trip, Dashboard, AccountSettings } from '@/types/kanban';
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
            trips,
            dashboards,
            accountSettings
        };
    }, [cards, trips, dashboards, accountSettings, stateRef]);

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
        markDirty,
        dashboards,
        setDashboards,
        setCards
    });

    const {
        addDashboard,
        updateDashboard,
        deleteDashboard
    } = useDashboardOperations({
        dashboards,
        setDashboards,
        markDirty,
        timezone: accountSettings?.timezone,
        trips,
        setCards
    });



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
        trips,
        dashboards,
        currentTripId,
        accountSettings,
        isLoading,

        addCard,
        updateCard,
        deleteCard,
        deleteAllCards,



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
        trips: Trip[];
        dashboards: Dashboard[];
        accountSettings: AccountSettings | null;
    }>({
        cards: [],
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
