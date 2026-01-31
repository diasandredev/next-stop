import React, { useEffect, useRef, useCallback } from 'react';
import { Card, Trip, Dashboard, AccountSettings } from '@/types/kanban';
import { useAuth } from './AuthContext';
import { useKanbanData } from '@/hooks/kanban/useKanbanData';
import { useCardOperations } from '@/hooks/kanban/useCardOperations';
import { useTripOperations } from '@/hooks/kanban/useTripOperations';
import { useDashboardOperations } from '@/hooks/kanban/useDashboardOperations';
import { useGroupOperations } from '@/hooks/kanban/useGroupOperations';
import { KanbanContext } from './KanbanContext';

// Inner provider that manages Kanban state
const KanbanInnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        cards, setCards,
        trips, setTrips,
        dashboards, setDashboards,
        groups,
        expenses,
        accountSettings, setAccountSettings,
        currentTripId, setCurrentTripId,
        isLoading,
        saveTrip, deleteTrip,
        saveDashboard, deleteDashboard,
        saveGroup, deleteGroup,
        saveCard, deleteCard,
        saveExpense, deleteExpense
    } = useKanbanData();


    const { user } = useAuth();

    const {
        addCard,
        updateCard,
        deleteCard: deleteCardOp,
        deleteAllCards
    } = useCardOperations({ cards, userEmail: user?.email, saveCard, deleteCard, currentTripId });

    const {
        addTrip,
        updateTrip,
        deleteTrip: deleteTripOp
    } = useTripOperations({
        trips,
        currentTripId,
        setCurrentTripId,
        dashboards,
        setDashboards, // Wait, setDashboards? I thought I removed it? No, in useTripOperations, I kept setDashboards in destructuring in step 161 replacement?
        // Let me check useTripOperations content from step 161.
        // It receives setDashboards. "dashboards, setDashboards, setCards".
        // But setDashboards is deprecated.
        // useTripOperations shouldn't need setDashboards anymore if I refactored it properly.
        // Let's check step 161 again.
        // It removes markDirty. It didn't remove setDashboards/setCards.
        // But useKanbanData still returns setDashboards (as no-op).
        // So passing it is fine for now, just useless.
        // I'll keep it to match the hook signature if it requires it.
        // Wait, check useTripOperations signature in step 161 replacement content.
        // "setDashboards: React.Dispatch..." is in props.
        // So I MUST pass it.
        setCards,      // usage in useTripOperations? It was used for deleteTrip cleanup maybe?
        // step 161: "setCards: React.Dispatch..." is in props.
        // So I must pass it.
        saveTrip,
        deleteTrip,
        ownerId: user?.uid
    });

    const {
        addDashboard,
        updateDashboard,
        deleteDashboard: deleteDashboardOp
    } = useDashboardOperations({
        dashboards,
        timezone: accountSettings?.timezone,
        trips,
        saveDashboard,
        deleteDashboard
    });

    const {
        addGroup,
        updateGroup,
        deleteGroup: deleteGroupOp
    } = useGroupOperations({
        groups,
        saveGroup,
        deleteGroup
    });

    const updateAccountSettings = useCallback((settings: Partial<AccountSettings>) => {
        setAccountSettings(prev => {
            const newSettings = prev ? { ...prev, ...settings } : settings as AccountSettings;
            // markDirty removed. State update triggers persistence effect in useKanbanData.
            return newSettings;
        });
    }, [setAccountSettings]);

    const addCustomColor = useCallback((color: string) => {
        setAccountSettings(prev => {
            const currentColors = prev?.customColors || [];
            if (currentColors.includes(color)) return prev;

            const newSettings = {
                ...prev,
                customColors: [...currentColors, color]
            } as AccountSettings;

            // markDirty removed.
            return newSettings;
        });
    }, [setAccountSettings]);

    const value = {
        cards,
        trips,
        dashboards,
        groups,
        currentTripId,
        accountSettings,
        isLoading,

        addCard,
        updateCard,
        deleteCard: deleteCardOp,
        deleteAllCards,

        addTrip,
        updateTrip,
        deleteTrip: deleteTripOp,
        setCurrentTripId,

        addDashboard,
        updateDashboard,
        deleteDashboard: deleteDashboardOp,

        addGroup,
        updateGroup,
        deleteGroup: deleteGroupOp,

        updateAccountSettings,
        addCustomColor,
        setCards, // Still exposed in context?
        expenses,
        saveExpense,
        deleteExpense
    };

    return (
        <KanbanContext.Provider value={value}>
            {children}
        </KanbanContext.Provider>
    );
};


// Outer KanbanProvider that wraps SyncProvider
// Outer KanbanProvider
export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <KanbanInnerProvider>
            {children}
        </KanbanInnerProvider>
    );
};
