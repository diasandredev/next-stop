import { useCallback } from 'react';
import { Trip, Dashboard, Card } from '@/types/kanban';

interface UseTripOperationsProps {
    setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
    currentTripId: string;
    setCurrentTripId: React.Dispatch<React.SetStateAction<string>>;
    markDirty: (id: string, type: string) => void;
    dashboards: Dashboard[];
    setDashboards: React.Dispatch<React.SetStateAction<Dashboard[]>>;
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

export const useTripOperations = ({
    setTrips,
    currentTripId,
    setCurrentTripId,
    markDirty,
    dashboards,
    setDashboards,
    setCards
}: UseTripOperationsProps) => {

    const addTrip = useCallback((name: string, startDate?: string, endDate?: string) => {
        const newTrip: Trip = {
            id: crypto.randomUUID(),
            name,
            startDate,
            endDate
        };
        setTrips(prev => [...prev, newTrip]);
        markDirty(newTrip.id, 'trips');
        return newTrip.id;
    }, [markDirty, setTrips]);

    const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
        setTrips(prev => prev.map(trip => {
            if (trip.id === id) {
                markDirty(id, 'trips');
                return { ...trip, ...updates };
            }
            return trip;
        }));
    }, [markDirty, setTrips]);

    const deleteTrip = useCallback((id: string) => {
        // 1. Identify associated dashboards
        const tripDashboards = dashboards.filter(d => d.tripId === id);
        const tripDashboardIds = new Set(tripDashboards.map(d => d.id));

        // 2. Delete Cards associated with those dashboards
        setCards(prev => {
            const toDelete = prev.filter(c => c.dashboardId && tripDashboardIds.has(c.dashboardId));
            toDelete.forEach(c => markDirty(c.id, 'cards'));
            return prev.filter(c => !c.dashboardId || !tripDashboardIds.has(c.dashboardId));
        });

        // 3. Delete Dashboards
        setDashboards(prev => {
            tripDashboards.forEach(d => markDirty(d.id, 'dashboards'));
            return prev.filter(d => d.tripId !== id);
        });

        // 4. Delete Trip
        setTrips(prev => prev.filter(t => t.id !== id));
        markDirty(id, 'trips');

        if (currentTripId === id) {
            // Logic to select another trip? 
            // handled by useKanbanData or generic selector
        }
    }, [currentTripId, dashboards, markDirty, setCards, setDashboards, setTrips]);

    return {
        addTrip,
        updateTrip,
        deleteTrip,
        setCurrentTripId
    };
};
