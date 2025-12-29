import { useCallback } from 'react';
import { Trip } from '@/types/kanban';

interface UseTripOperationsProps {
    setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
    currentTripId: string;
    setCurrentTripId: React.Dispatch<React.SetStateAction<string>>;
    markDirty: (id: string, type: string) => void;
}

export const useTripOperations = ({
    setTrips,
    currentTripId,
    setCurrentTripId,
    markDirty
}: UseTripOperationsProps) => {

    const addTrip = useCallback((name: string, startDate?: string) => {
        const newTrip: Trip = {
            id: crypto.randomUUID(),
            name,
            startDate
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
        setTrips(prev => prev.filter(t => t.id !== id));
        markDirty(id, 'trips');
        if (currentTripId === id) {
            // Logic to select another trip? 
            // handled by useKanbanData or generic selector
        }
    }, [currentTripId, markDirty, setTrips]);

    return {
        addTrip,
        updateTrip,
        deleteTrip,
        setCurrentTripId
    };
};
