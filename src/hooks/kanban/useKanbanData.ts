import { useState, useEffect } from 'react';
import { Card, ExtraColumn, Trip, Dashboard, AccountSettings } from '@/types/kanban';
import { useSync } from '../../contexts/SyncContext';
import { useAuth } from '../../contexts/AuthContext';
import { db, dbPromise } from '@/utils/db';

const defaultExtraColumns: ExtraColumn[] = [
    // These might need dashboardId now, but for defaults we might wait until a dashboard exists
    // OR we just define the structure
];

export const useKanbanData = () => {
    const { markDirty, initialFetch } = useSync();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // State for all Kanban data
    const [cards, setCards] = useState<Card[]>([]);
    const [extraColumns, setExtraColumns] = useState<ExtraColumn[]>([]);

    // New States
    const [trips, setTrips] = useState<Trip[]>([]);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);

    const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
    const [currentTripId, setCurrentTripId] = useState<string>('1');

    // Initial Data Fetch (DB or API)
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Load from IndexedDB
                const dbCards = await db.getAllCards();
                const dbExtraColumns = await db.getExtraColumns();
                const dbTrips = await db.getTrips();
                const dbDashboards = await db.getDashboards();
                const dbSettings = await db.getAccountSettings();
                const dbCurrentTripId = await db.getLastTripId();

                setCards(dbCards);
                setExtraColumns(dbExtraColumns);

                if (dbTrips.length > 0) {
                    setTrips(dbTrips);
                }

                if (dbDashboards.length > 0) {
                    setDashboards(dbDashboards);
                }

                if (dbSettings) {
                    setAccountSettings(dbSettings);
                } else {
                    const defaultSettings: AccountSettings = {
                        defaultTripId: '1',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };
                    setAccountSettings(defaultSettings);
                    await db.saveAccountSettings(defaultSettings);
                }

                if (dbCurrentTripId) {
                    setCurrentTripId(dbCurrentTripId);
                } else if (dbTrips.length > 0) {
                    setCurrentTripId(dbTrips[0].id);
                }

                // 2. Sync (simplified for refactor: assume structure matches or sync will handle it? 
                // We might need to update Sync logic too, but for now we focus on local DB structure)
                // if (user) { ... } 

            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [initialFetch, user]);

    // Persistence Effects (IndexedDB)

    useEffect(() => {
        if (!isLoading) {
            const save = async () => {
                await db.clearCards();
                const tx = dbPromise.then(async (realDb) => {
                    const t = realDb.transaction('cards', 'readwrite');
                    await Promise.all(cards.map(c => t.store.put(c)));
                    await t.done;
                });
                await tx;
            };
            save();
        }
    }, [cards, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            const save = async () => {
                // Determine deleted extra columns?
                // For now, simpler sync
                const existing = await db.getExtraColumns();
                const currentIds = new Set(extraColumns.map(c => c.id));
                for (const e of existing) {
                    if (!currentIds.has(e.id)) await db.deleteExtraColumn(e.id);
                }
                for (const c of extraColumns) await db.saveExtraColumn(c);
            };
            save();
        }
    }, [extraColumns, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            const save = async () => {
                const existing = await db.getTrips();
                const currentIds = new Set(trips.map(c => c.id));
                for (const e of existing) {
                    if (!currentIds.has(e.id)) await db.deleteTrip(e.id);
                }
                for (const c of trips) await db.saveTrip(c);
            };
            save();
        }
    }, [trips, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            const save = async () => {
                const existing = await db.getDashboards();
                const currentIds = new Set(dashboards.map(c => c.id));
                for (const e of existing) {
                    if (!currentIds.has(e.id)) await db.deleteDashboard(e.id);
                }
                for (const c of dashboards) await db.saveDashboard(c);
            };
            save();
        }
    }, [dashboards, isLoading]);

    useEffect(() => {
        if (accountSettings && !isLoading) {
            db.saveAccountSettings(accountSettings);
        }
    }, [accountSettings, isLoading]);

    useEffect(() => {
        if (currentTripId && !isLoading) {
            db.saveLastTripId(currentTripId);
        }
    }, [currentTripId, isLoading]);

    return {
        cards,
        setCards,
        extraColumns,
        setExtraColumns,
        trips,
        setTrips,
        dashboards,
        setDashboards,
        accountSettings,
        setAccountSettings,
        currentTripId,
        setCurrentTripId,
        isLoading,
        markDirty
    };
};
