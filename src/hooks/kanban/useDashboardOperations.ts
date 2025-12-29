import { useCallback } from 'react';
import { Dashboard } from '@/types/kanban';
import { formatInTimeZone } from 'date-fns-tz';

interface UseDashboardOperationsProps {
    dashboards: Dashboard[];
    setDashboards: React.Dispatch<React.SetStateAction<Dashboard[]>>;
    markDirty: (id: string, type: string) => void;
    timezone?: string;
}

export const useDashboardOperations = ({
    dashboards,
    setDashboards,
    markDirty,
    timezone
}: UseDashboardOperationsProps) => {

    const addDashboard = useCallback((tripId: string, name: string, startDate?: string, days?: number) => {
        // Find existing dashboards for this trip to determine defaults
        const tripDashboards = dashboards
            .filter(d => d.tripId === tripId)
            // Sort by startDate to find the "last" one chronologically
            .sort((a, b) => {
                const timeA = a.startDate ? new Date(a.startDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const timeB = b.startDate ? new Date(b.startDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return timeA - timeB;
            });

        let finalDays = days;
        let finalStartDate = startDate;

        // Use configured timezone or fallback to system
        const targetTimeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (tripDashboards.length === 0) {
            // Default Case: First dashboard
            // If no days specified, default to 1 day
            if (finalDays === undefined) finalDays = 1;
            // If no startDate specified, default to today in configured timezone
            if (!finalStartDate) {
                finalStartDate = formatInTimeZone(new Date(), targetTimeZone, 'yyyy-MM-dd');
            }
        } else {
            // Subsequent Case: Previous dashboards exist
            // If no days specified, default to 1 day
            if (finalDays === undefined) finalDays = 1;

            // If no startDate specified, calculate from last dashboard
            if (!finalStartDate) {
                const lastDashboard = tripDashboards[tripDashboards.length - 1];
                if (lastDashboard.startDate) {
                    const lastStart = new Date(lastDashboard.startDate);
                    // Start on the last day of the previous dashboard
                    // Last Day = Start + (Days - 1)
                    // We need the day AFTER the last day = Start + Days
                    const nextDate = new Date(lastStart);
                    nextDate.setDate(lastStart.getDate() + lastDashboard.days);
                    finalStartDate = nextDate.toISOString();
                } else {
                    // Fallback if last dashboard has no date (shouldn't happen usually)
                    finalStartDate = formatInTimeZone(new Date(), targetTimeZone, 'yyyy-MM-dd');
                }
            }
        }

        const newDashboard: Dashboard = {
            id: crypto.randomUUID(),
            tripId,
            name,
            days: finalDays!, // finalDays is definitely set above
            startDate: finalStartDate,
            createdAt: new Date().toISOString()
        };
        setDashboards(prev => [...prev, newDashboard]);
        markDirty(newDashboard.id, 'dashboards');
        return newDashboard.id;
    }, [dashboards, markDirty, setDashboards]);

    const updateDashboard = useCallback((id: string, updates: Partial<Dashboard>) => {
        setDashboards(prev => prev.map(dash => {
            if (dash.id === id) {
                markDirty(id, 'dashboards');
                return { ...dash, ...updates };
            }
            return dash;
        }));
    }, [markDirty, setDashboards]);

    const deleteDashboard = useCallback((id: string) => {
        setDashboards(prev => prev.filter(d => d.id !== id));
        markDirty(id, 'dashboards');
    }, [markDirty, setDashboards]);

    return {
        addDashboard,
        updateDashboard,
        deleteDashboard
    };
};
