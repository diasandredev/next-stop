import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
    collection,
    doc,
    onSnapshot,
    query,
    where,
    setDoc,
    deleteDoc,
    Unsubscribe,
    DocumentData
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, Dashboard, Card } from '@/types/kanban';

interface RealtimeSyncState {
    trips: Trip[];
    dashboards: Dashboard[];
    cards: Card[];
    isLoading: boolean;
    error: Error | null;
}

interface UseRealtimeSyncReturn extends RealtimeSyncState {
    saveTrip: (trip: Trip) => Promise<void>;
    deleteTrip: (tripId: string) => Promise<void>;
    saveDashboard: (tripId: string, dashboard: Dashboard) => Promise<void>;
    deleteDashboard: (tripId: string, dashboardId: string) => Promise<void>;
    saveCard: (tripId: string, card: Card) => Promise<void>;
    deleteCard: (tripId: string, cardId: string) => Promise<void>;
}

/**
 * Hook for real-time sync with Firestore for shared trips.
 * Subscribes to trips the user owns or has been shared with.
 * Updates propagate in near real-time (<10 seconds).
 */
export const useRealtimeSync = (): UseRealtimeSyncReturn => {
    const { user } = useAuth();
    const [state, setState] = useState<RealtimeSyncState>({
        trips: [],
        dashboards: [],
        cards: [],
        isLoading: true,
        error: null,
    });

    const unsubscribersRef = useRef<Unsubscribe[]>([]);
    const dashboardUnsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());
    const cardUnsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());

    // Clean up all listeners
    const cleanupListeners = useCallback(() => {
        unsubscribersRef.current.forEach(unsub => unsub());
        unsubscribersRef.current = [];
        dashboardUnsubscribersRef.current.forEach(unsub => unsub());
        dashboardUnsubscribersRef.current.clear();
        cardUnsubscribersRef.current.forEach(unsub => unsub());
        cardUnsubscribersRef.current.clear();
    }, []);

    // Subscribe to a trip's dashboards
    const subscribeToDashboards = useCallback((tripId: string) => {
        if (dashboardUnsubscribersRef.current.has(tripId)) return;

        const dashboardsRef = collection(db, `trips/${tripId}/dashboards`);
        const unsub = onSnapshot(dashboardsRef, (snapshot) => {
            const dashboardsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                tripId,
            })) as Dashboard[];

            setState(prev => {
                // Remove old dashboards for this trip and add new ones
                const otherDashboards = prev.dashboards.filter(d => d.tripId !== tripId);
                return {
                    ...prev,
                    dashboards: [...otherDashboards, ...dashboardsData],
                };
            });
        }, (error) => {
            console.error(`Error subscribing to dashboards for trip ${tripId}:`, error);
        });

        dashboardUnsubscribersRef.current.set(tripId, unsub);
    }, []);

    // Subscribe to a trip's cards
    const subscribeToCards = useCallback((tripId: string) => {
        if (cardUnsubscribersRef.current.has(tripId)) return;

        const cardsRef = collection(db, `trips/${tripId}/cards`);
        const unsub = onSnapshot(cardsRef, (snapshot) => {
            const cardsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Card[];

            setState(prev => {
                // Get dashboards for this trip
                const tripDashboardIds = new Set(
                    prev.dashboards.filter(d => d.tripId === tripId).map(d => d.id)
                );
                // Remove old cards for these dashboards and add new ones
                const otherCards = prev.cards.filter(c => !tripDashboardIds.has(c.dashboardId || ''));
                return {
                    ...prev,
                    cards: [...otherCards, ...cardsData],
                };
            });
        }, (error) => {
            console.error(`Error subscribing to cards for trip ${tripId}:`, error);
        });

        cardUnsubscribersRef.current.set(tripId, unsub);
    }, []);

    // Unsubscribe from a trip's subcollections
    const unsubscribeFromTrip = useCallback((tripId: string) => {
        const dashboardUnsub = dashboardUnsubscribersRef.current.get(tripId);
        if (dashboardUnsub) {
            dashboardUnsub();
            dashboardUnsubscribersRef.current.delete(tripId);
        }

        const cardUnsub = cardUnsubscribersRef.current.get(tripId);
        if (cardUnsub) {
            cardUnsub();
            cardUnsubscribersRef.current.delete(tripId);
        }
    }, []);

    // Main effect: subscribe to trips
    useEffect(() => {
        if (!user?.email || !user?.uid) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true }));

        // Query for trips owned by user OR shared with user
        const tripsRef = collection(db, 'trips');

        // We need two queries: one for owned trips, one for shared trips
        // Firestore doesn't support OR queries across different fields,
        // so we'll use two separate listeners

        // 1. Trips owned by user
        const ownedQuery = query(tripsRef, where('ownerId', '==', user.uid));
        const ownedUnsub = onSnapshot(ownedQuery, (snapshot) => {
            const ownedTrips = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Trip[];

            setState(prev => {
                // Merge with shared trips
                const sharedTrips = prev.trips.filter(t => t.ownerId !== user.uid);
                const allTrips = [...ownedTrips, ...sharedTrips];

                // Subscribe to subcollections for new trips
                ownedTrips.forEach(trip => {
                    subscribeToDashboards(trip.id);
                    subscribeToCards(trip.id);
                });

                return {
                    ...prev,
                    trips: allTrips,
                    isLoading: false,
                };
            });
        }, (error) => {
            console.error('Error subscribing to owned trips:', error);
            setState(prev => ({ ...prev, error, isLoading: false }));
        });

        unsubscribersRef.current.push(ownedUnsub);

        // 2. Trips shared with user
        const sharedQuery = query(tripsRef, where('sharedEmails', 'array-contains', user.email));
        const sharedUnsub = onSnapshot(sharedQuery, (snapshot) => {
            const sharedTrips = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Trip[];

            setState(prev => {
                // Merge with owned trips
                const ownedTrips = prev.trips.filter(t => t.ownerId === user.uid);
                const allTrips = [...ownedTrips, ...sharedTrips];

                // Subscribe to subcollections for new shared trips
                sharedTrips.forEach(trip => {
                    subscribeToDashboards(trip.id);
                    subscribeToCards(trip.id);
                });

                return {
                    ...prev,
                    trips: allTrips,
                    isLoading: false,
                };
            });
        }, (error) => {
            console.error('Error subscribing to shared trips:', error);
            setState(prev => ({ ...prev, error, isLoading: false }));
        });

        unsubscribersRef.current.push(sharedUnsub);

        return () => {
            cleanupListeners();
        };
    }, [user?.email, user?.uid, cleanupListeners, subscribeToDashboards, subscribeToCards]);

    // CRUD operations
    const saveTrip = useCallback(async (trip: Trip) => {
        if (!user?.uid) return;

        const tripData: DocumentData = {
            ...trip,
            ownerId: (trip.ownerId && trip.ownerId !== 'current-user-will-be-set-in-sync') ? trip.ownerId : user.uid,
            // Denormalize emails for Firestore rules
            sharedEmails: trip.sharedWith?.map(s => s.email) || [],
            editorEmails: trip.sharedWith?.filter(s => s.permission === 'edit').map(s => s.email) || [],
        };

        await setDoc(doc(db, 'trips', trip.id), tripData, { merge: true });
    }, [user?.uid]);

    const deleteTrip = useCallback(async (tripId: string) => {
        unsubscribeFromTrip(tripId);
        await deleteDoc(doc(db, 'trips', tripId));
    }, [unsubscribeFromTrip]);

    const saveDashboard = useCallback(async (tripId: string, dashboard: Dashboard) => {
        const dashboardData = { ...dashboard };
        delete (dashboardData as any).tripId; // Don't duplicate tripId in subcollection
        await setDoc(doc(db, `trips/${tripId}/dashboards`, dashboard.id), dashboardData, { merge: true });
    }, []);

    const deleteDashboard = useCallback(async (tripId: string, dashboardId: string) => {
        await deleteDoc(doc(db, `trips/${tripId}/dashboards`, dashboardId));
    }, []);

    const saveCard = useCallback(async (tripId: string, card: Card) => {
        // Sanitize card to remove undefined values which Firestore setDoc doesn't accept
        const saneCard = JSON.parse(JSON.stringify(card));
        await setDoc(doc(db, `trips/${tripId}/cards`, card.id), saneCard, { merge: true });
    }, []);

    const deleteCard = useCallback(async (tripId: string, cardId: string) => {
        await deleteDoc(doc(db, `trips/${tripId}/cards`, cardId));
    }, []);

    return {
        ...state,
        saveTrip,
        deleteTrip,
        saveDashboard,
        deleteDashboard,
        saveCard,
        deleteCard,
    };
};
