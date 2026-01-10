import { useCallback } from 'react';
import { Trip, Dashboard, Card } from '@/types/kanban';

interface UseTripOperationsProps {
    trips: Trip[];
    setTrips?: React.Dispatch<React.SetStateAction<Trip[]>>; // Deprecated, kept for interface compat if needed but unused
    currentTripId: string;
    setCurrentTripId: React.Dispatch<React.SetStateAction<string>>;
    dashboards: Dashboard[];
    setDashboards: React.Dispatch<React.SetStateAction<Dashboard[]>>;
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    saveTrip: (trip: Trip) => Promise<void>;
    deleteTrip: (tripId: string) => Promise<void>;
    ownerId?: string;
}

export const useTripOperations = ({
    trips,
    currentTripId,
    setCurrentTripId,
    dashboards,
    setDashboards,
    setCards,
    saveTrip,
    deleteTrip,
    ownerId
}: UseTripOperationsProps) => {

    const addTrip = useCallback((name: string, startDate?: string, endDate?: string) => {
        const newTrip: Trip = {
            id: crypto.randomUUID(),
            name,
            startDate,
            endDate,
            ownerId: ownerId || "current-user-will-be-set-in-sync"
        };
        saveTrip(newTrip);
        return newTrip.id;
    }, [saveTrip, ownerId]);

    const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
        const trip = trips.find(t => t.id === id);
        if (trip) {
            const updated = { ...trip, ...updates };
            saveTrip(updated);
        }
    }, [saveTrip, trips]);

    const deleteTripFn = useCallback((id: string) => {
        deleteTrip(id);
        if (currentTripId === id) {
            const otherTrip = trips.find(t => t.id !== id);
            setCurrentTripId(otherTrip ? otherTrip.id : '');
        }
    }, [currentTripId, deleteTrip, trips, setCurrentTripId]);

    return {
        addTrip,
        updateTrip,
        deleteTrip: deleteTripFn,
        setCurrentTripId
    };
};

