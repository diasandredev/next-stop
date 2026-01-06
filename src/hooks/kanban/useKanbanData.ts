import { useState, useEffect } from 'react';
import { Card, Trip, Dashboard, AccountSettings } from '@/types/kanban';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSync } from './useRealtimeSync';
import { db, dbPromise } from '@/utils/db';
import { db as firestoreDb } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const useKanbanData = () => {
    const { user } = useAuth();

    // Use RealtimeSync for Trips, Dashboards, and Cards
    const {
        trips: syncTrips,
        dashboards: syncDashboards,
        cards: syncCards,
        isLoading: isSyncLoading,
        saveTrip,
        deleteTrip,
        saveDashboard,
        deleteDashboard,
        saveCard,
        deleteCard
    } = useRealtimeSync();

    const [isLoading, setIsLoading] = useState(true);

    // State for all Kanban data (derived from Sync or Local Base)
    const [cards, setCards] = useState<Card[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [dashboards, setDashboards] = useState<Dashboard[]>([]);

    const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
    const [currentTripId, setCurrentTripId] = useState<string>('1');

    // Initial Data Fetch (Local DB)
    useEffect(() => {
        const loadLocalData = async () => {
            setIsLoading(true);
            try {
                // 1. Load from IndexedDB
                const dbCards = await db.getAllCards();
                const dbTrips = await db.getTrips();
                const dbDashboards = await db.getDashboards();
                const dbSettings = await db.getAccountSettings();
                const dbCurrentTripId = await db.getLastTripId();

                setCards(dbCards);

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

            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLocalData();
    }, []);

    // Sync Update Effect: When RealtimeSync has data, update state and persist to LocalDB
    useEffect(() => {
        if (!isSyncLoading && user) {
            // Update state with synchronized data
            setTrips(syncTrips);
            setDashboards(syncDashboards);
            setCards(syncCards);

            // Persist to IndexedDB for offline support
            const persistToLocal = async () => {
                // Trips
                await db.syncTrips(syncTrips);

                // Dashboards
                await db.syncDashboards(syncDashboards);

                // Cards
                await db.syncCards(syncCards);
            };

            persistToLocal();
        }
    }, [syncTrips, syncDashboards, syncCards, isSyncLoading, user]);

    // Persistence Effects for AccountSettings (Local DB + Firestore)
    useEffect(() => {
        if (accountSettings && !isLoading) {
            // 1. Local Persistence
            db.saveAccountSettings(accountSettings);

            // 2. Cloud Persistence (Replaces legacy SyncContext)
            if (user?.uid) {
                const saveToFirestore = async () => {
                    try {
                        await setDoc(doc(firestoreDb, `users/${user.uid}/accountSettings`, 'settings'), accountSettings, { merge: true });
                    } catch (err) {
                        console.error("Failed to sync settings to Firestore", err);
                    }
                };
                saveToFirestore();
            }
        }
    }, [accountSettings, isLoading, user?.uid]);

    useEffect(() => {
        if (currentTripId && !isLoading) {
            db.saveLastTripId(currentTripId);
        }
    }, [currentTripId, isLoading]);

    return {
        cards,
        setCards: () => console.warn('setCards is deprecated, use addCard/updateCard/deleteCard operations'), // No-op/Warn as state is managed by sync
        trips,
        setTrips: () => console.warn('setTrips is deprecated'),
        dashboards,
        setDashboards: () => console.warn('setDashboards is deprecated'),
        accountSettings,
        setAccountSettings,
        currentTripId,
        setCurrentTripId,
        isLoading: isLoading || isSyncLoading,
        // Expose CRUD from RealtimeSync
        saveTrip,
        deleteTrip,
        saveDashboard,
        deleteDashboard,
        saveCard,
        deleteCard
    };
};
