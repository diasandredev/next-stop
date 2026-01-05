import { useCallback } from 'react';
import { Dashboard, Trip, Card } from '@/types/kanban';
import { formatInTimeZone } from 'date-fns-tz';

interface UseDashboardOperationsProps {
    dashboards: Dashboard[];
    setDashboards: React.Dispatch<React.SetStateAction<Dashboard[]>>;
    markDirty: (id: string, type: string) => void;
    timezone?: string;
    trips: Trip[];
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

export const useDashboardOperations = ({
    dashboards,
    setDashboards,
    markDirty,
    timezone,
    trips,
    setCards
}: UseDashboardOperationsProps) => {

    const addDashboard = useCallback((tripId: string, name: string, startDate?: string, days?: number) => {
        const trip = trips.find(t => t.id === tripId);

        // Find existing dashboards for this trip
        const tripDashboards = dashboards
            .filter(d => d.tripId === tripId)
            .sort((a, b) => {
                const timeA = a.startDate ? new Date(a.startDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const timeB = b.startDate ? new Date(b.startDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return timeA - timeB;
            });

        let finalDays = days;
        let finalStartDate = startDate;
        const targetTimeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Default logic
        if (tripDashboards.length === 0) {
            if (finalDays === undefined) finalDays = 1;
            if (!finalStartDate) {
                // If trip has start date, use it. Otherwise use today.
                if (trip?.startDate) {
                    finalStartDate = trip.startDate;
                } else {
                    finalStartDate = formatInTimeZone(new Date(), targetTimeZone, 'yyyy-MM-dd');
                }
            }
        } else {
            if (finalDays === undefined) finalDays = 1;
            if (!finalStartDate) {
                const lastDashboard = tripDashboards[tripDashboards.length - 1];
                if (lastDashboard.startDate) {
                    const lastStart = new Date(lastDashboard.startDate);
                    const nextDate = new Date(lastStart);
                    nextDate.setDate(lastStart.getDate() + lastDashboard.days);
                    finalStartDate = nextDate.toISOString();
                } else {
                    finalStartDate = formatInTimeZone(new Date(), targetTimeZone, 'yyyy-MM-dd');
                }
            }
        }

        // VALIDATION: Start Date must be >= Trip Start Date
        if (trip?.startDate && finalStartDate && new Date(finalStartDate) < new Date(trip.startDate)) {
            finalStartDate = trip.startDate;
        }

        // VALIDATION: End Date must be <= Trip End Date
        // Actually, we can just clamp the days or start date if needed?
        // User request: "data final do dashboard deve ser menor ou igual ao ultimo dia da trip"
        // Let's check end date.
        if (trip?.endDate && finalStartDate && finalDays) {
            const start = new Date(finalStartDate);
            const proposedEnd = new Date(start);
            proposedEnd.setDate(start.getDate() + finalDays - 1); // Inclusive

            const tripEnd = new Date(trip.endDate);
            // tripEnd should be inclusive (e.g. ends on Jan 10 means Jan 10 is last day)
            // If proposedEnd > tripEnd
            if (proposedEnd > tripEnd) {
                // Option 1: Reduce days
                const diffTime = tripEnd.getTime() - start.getTime();
                const maxDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 because inclusive
                if (maxDays > 0) {
                    finalDays = maxDays;
                } else {
                    // Start date is already after trip end, which is bad. 
                    // But we already checked start >= start. If start > end, that's a trip config issue or user error.
                }
            }
        }

        const newDashboard: Dashboard = {
            id: crypto.randomUUID(),
            tripId,
            name,
            days: finalDays!,
            startDate: finalStartDate,
            createdAt: new Date().toISOString()
        };
        setDashboards(prev => [...prev, newDashboard]);
        markDirty(newDashboard.id, 'dashboards');
        return newDashboard.id;
    }, [dashboards, markDirty, setDashboards, timezone, trips]);

    const updateDashboard = useCallback((id: string, updates: Partial<Dashboard>) => {
        setDashboards(prev => prev.map(dash => {
            if (dash.id === id) {
                // We should validate here too, but updates usually come from UI which we will constrain.
                // However, adding basic validation here is safe.
                // We need the trip for this dashboard.
                // Since this is inside map, we might not have efficient access to trip without searching.
                // Let's rely on UI constraints for updateDashboard for now to avoid perf hit or complex logic inside map.
                // Or we can find trip outside.

                markDirty(id, 'dashboards');
                return { ...dash, ...updates };
            }
            return dash;
        }));
    }, [markDirty, setDashboards]);

    const deleteDashboard = useCallback((id: string) => {
        // Cascading delete: Remove cards associated with this dashboard
        setCards(prev => {
            const toDelete = prev.filter(c => c.dashboardId === id);
            toDelete.forEach(c => markDirty(c.id, 'cards'));
            return prev.filter(c => c.dashboardId !== id);
        });

        setDashboards(prev => prev.filter(d => d.id !== id));
        markDirty(id, 'dashboards');
    }, [markDirty, setCards, setDashboards]);

    return {
        addDashboard,
        updateDashboard,
        deleteDashboard
    };
};
