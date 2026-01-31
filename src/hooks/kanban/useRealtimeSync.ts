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
    getDocs,
    writeBatch,
    deleteField,
    Unsubscribe,
    DocumentData
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, Dashboard, Card } from '@/types/kanban';
import { Group } from '@/types/group';
import { Expense } from '@/types/finance';

interface RealtimeSyncState {
    trips: Trip[];
    dashboards: Dashboard[];
    groups: Group[];
    cards: Card[];
    expenses: Expense[];
    isLoading: boolean;
    error: Error | null;
}

interface UseRealtimeSyncReturn extends RealtimeSyncState {
    saveTrip: (trip: Trip) => Promise<void>;
    deleteTrip: (tripId: string) => Promise<void>;
    saveDashboard: (tripId: string, dashboard: Dashboard) => Promise<void>;
    deleteDashboard: (tripId: string, dashboardId: string) => Promise<void>;
    saveGroup: (dashboardId: string, group: Group) => Promise<void>;
    deleteGroup: (dashboardId: string, groupId: string) => Promise<void>;
    saveCard: (tripId: string, card: Card) => Promise<void>;
    deleteCard: (tripId: string, cardId: string) => Promise<void>;
    saveExpense: (tripId: string, expense: Expense) => Promise<void>;
    deleteExpense: (tripId: string, expenseId: string) => Promise<void>;
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
        groups: [],
        cards: [],
        expenses: [],
        isLoading: true,
        error: null,
    });

    const unsubscribersRef = useRef<Unsubscribe[]>([]);
    const dashboardUnsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());
    const groupUnsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());
    const cardUnsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());
    const expenseUnsubscribersRef = useRef<Map<string, Unsubscribe>>(new Map());

    // Clean up all listeners
    const cleanupListeners = useCallback(() => {
        unsubscribersRef.current.forEach(unsub => unsub());
        unsubscribersRef.current = [];
        dashboardUnsubscribersRef.current.forEach(unsub => unsub());
        dashboardUnsubscribersRef.current.clear();
        groupUnsubscribersRef.current.forEach(unsub => unsub());
        groupUnsubscribersRef.current.clear();
        cardUnsubscribersRef.current.forEach(unsub => unsub());
        cardUnsubscribersRef.current.clear();
        expenseUnsubscribersRef.current.forEach(unsub => unsub());
        expenseUnsubscribersRef.current.clear();
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

    // Subscribe to groups for all dashboards in a trip
    const subscribeToGroups = useCallback((tripId: string) => {
        if (groupUnsubscribersRef.current.has(tripId)) return;

        const dashboardsRef = collection(db, `trips/${tripId}/dashboards`);
        const unsub = onSnapshot(dashboardsRef, (dashboardSnapshot) => {
            // For each dashboard, subscribe to its groups subcollection
            dashboardSnapshot.docs.forEach(dashboardDoc => {
                const dashboardId = dashboardDoc.id;
                const groupsRef = collection(db, `trips/${tripId}/dashboards/${dashboardId}/groups`);

                onSnapshot(groupsRef, (groupSnapshot) => {
                    const groupsData = groupSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        id: doc.id,
                        dashboardId,
                    })) as Group[];

                    setState(prev => {
                        // Remove old groups for this dashboard and add new ones
                        const otherGroups = prev.groups.filter(g => g.dashboardId !== dashboardId);
                        return {
                            ...prev,
                            groups: [...otherGroups, ...groupsData],
                        };
                    });
                }, (error) => {
                    console.error(`Error subscribing to groups for dashboard ${dashboardId}:`, error);
                });
            });
        });

        groupUnsubscribersRef.current.set(tripId, unsub);
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

    // Subscribe to a trip's expenses
    const subscribeToExpenses = useCallback((tripId: string) => {
        if (expenseUnsubscribersRef.current.has(tripId)) return;

        const expensesRef = collection(db, `trips/${tripId}/expenses`);
        const unsub = onSnapshot(expensesRef, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            })) as Expense[];

            setState(prev => {
                const otherExpenses = prev.expenses.filter(e => e.tripId !== tripId);
                return {
                    ...prev,
                    expenses: [...otherExpenses, ...expensesData],
                };
            });
        }, (error) => {
            console.error(`Error subscribing to expenses for trip ${tripId}:`, error);
        });

        expenseUnsubscribersRef.current.set(tripId, unsub);
    }, []);

    // Unsubscribe from a trip's subcollections
    const unsubscribeFromTrip = useCallback((tripId: string) => {
        const dashboardUnsub = dashboardUnsubscribersRef.current.get(tripId);
        if (dashboardUnsub) {
            dashboardUnsub();
            dashboardUnsubscribersRef.current.delete(tripId);
        }

        const groupUnsub = groupUnsubscribersRef.current.get(tripId);
        if (groupUnsub) {
            groupUnsub();
            groupUnsubscribersRef.current.delete(tripId);
        }

        const cardUnsub = cardUnsubscribersRef.current.get(tripId);
        if (cardUnsub) {
            cardUnsub();
            cardUnsubscribersRef.current.delete(tripId);
        }

        const expenseUnsub = expenseUnsubscribersRef.current.get(tripId);
        if (expenseUnsub) {
            expenseUnsub();
            expenseUnsubscribersRef.current.delete(tripId);
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
        const ownedUnsub = onSnapshot(ownedQuery, { includeMetadataChanges: true }, (snapshot) => {
            const ownedTrips = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                hasPendingWrites: doc.metadata.hasPendingWrites,
            })) as (Trip & { hasPendingWrites?: boolean })[];

            setState(prev => {
                // Merge with shared trips
                const sharedTrips = prev.trips.filter(t => t.ownerId !== user.uid);
                // We cast back to Trip[] because hasPendingWrites is internal usage here
                const allTrips = [...ownedTrips, ...sharedTrips] as Trip[];

                // Subscribe to subcollections for new trips
                ownedTrips.forEach(trip => {
                    // Skip subscription if the trip is being created (has pending writes)
                    // The listener will fire again when the write commits
                    if (trip.hasPendingWrites) return;

                    subscribeToDashboards(trip.id);
                    subscribeToGroups(trip.id);
                    subscribeToCards(trip.id);
                    subscribeToExpenses(trip.id);
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
                    subscribeToGroups(trip.id);
                    subscribeToCards(trip.id);
                    subscribeToExpenses(trip.id);
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
    }, [user?.email, user?.uid, cleanupListeners, subscribeToDashboards, subscribeToGroups, subscribeToCards, subscribeToExpenses]);

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
        const trip = state.trips.find(t => t.id === tripId);
        if (!trip) {
            // It might be legal to delete a trip you can't see? No.
            // But if it's not in state, we can't check owner.
            // Let's assume if it's not in state (synced), we shouldn't touch it.
            return;
        }

        if (trip.ownerId !== user?.uid) {
            console.error("Only the owner can delete the trip");
            throw new Error("Only the owner can delete the trip");
        }

        unsubscribeFromTrip(tripId);

        const batch = writeBatch(db);

        // 1. Delete all cards
        const cardsRef = collection(db, `trips/${tripId}/cards`);
        const cardsSnapshot = await getDocs(cardsRef);
        cardsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 2. Delete all dashboards and their groups
        const dashboardsRef = collection(db, `trips/${tripId}/dashboards`);
        const dashboardsSnapshot = await getDocs(dashboardsRef);

        // We can't batch delete subcollections of dashboards easily without reading them first
        // So for each dashboard, find groups and delete
        for (const dashboardDoc of dashboardsSnapshot.docs) {
            const groupsRef = collection(db, `trips/${tripId}/dashboards/${dashboardDoc.id}/groups`);
            const groupsSnapshot = await getDocs(groupsRef);
            groupsSnapshot.docs.forEach(gDoc => {
                batch.delete(gDoc.ref);
            });
            // Delete the dashboard doc
            batch.delete(dashboardDoc.ref);
        }

        // 4. Delete all expenses
        const expensesRef = collection(db, `trips/${tripId}/expenses`);
        const expensesSnapshot = await getDocs(expensesRef);
        expensesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 3. Delete the trip doc
        batch.delete(doc(db, 'trips', tripId));

        await batch.commit();
    }, [unsubscribeFromTrip, state.trips, user?.uid]);

    const saveDashboard = useCallback(async (tripId: string, dashboard: Dashboard) => {
        const { tripId: _, ...dashboardData } = dashboard;
        await setDoc(doc(db, `trips/${tripId}/dashboards`, dashboard.id), dashboardData, { merge: true });
    }, []);

    const deleteDashboard = useCallback(async (tripId: string, dashboardId: string) => {
        const trip = state.trips.find(t => t.id === tripId);
        if (!trip) {
            console.error("Trip not found for deletion permissions check");
            return;
        }

        if (trip.ownerId !== user?.uid) {
            console.error("Only the owner can delete dashboards");
            // You might want to throw an error here to catch it in the UI
            throw new Error("Only the owner can delete dashboards");
        }

        // 1. Delete all cards in this dashboard
        // We need to query cards where dashboardId == dashboardId
        // The cards are in trips/{tripId}/cards
        const cardsRef = collection(db, `trips/${tripId}/cards`);
        const cardsQuery = query(cardsRef, where('dashboardId', '==', dashboardId));
        const cardsSnapshot = await getDocs(cardsQuery);

        const batch = writeBatch(db);
        cardsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 2. Delete all groups in this dashboard
        // groups are in trips/{tripId}/dashboards/{dashboardId}/groups
        const groupsRef = collection(db, `trips/${tripId}/dashboards/${dashboardId}/groups`);
        const groupsSnapshot = await getDocs(groupsRef);
        groupsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 3. Delete the dashboard itself
        const dashboardRef = doc(db, `trips/${tripId}/dashboards`, dashboardId);
        batch.delete(dashboardRef);

        await batch.commit();

    }, [state.trips, user?.uid]);

    const saveGroup = useCallback(async (dashboardId: string, group: Group) => {
        // Find the trip that owns this dashboard
        const dashboard = state.dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        const { dashboardId: _, ...groupData } = group;
        await setDoc(doc(db, `trips/${dashboard.tripId}/dashboards/${dashboardId}/groups`, group.id), groupData, { merge: true });
    }, [state.dashboards]);

    const deleteGroup = useCallback(async (dashboardId: string, groupId: string) => {
        // Find the trip that owns this dashboard
        const dashboard = state.dashboards.find(d => d.id === dashboardId);
        if (!dashboard) return;

        await deleteDoc(doc(db, `trips/${dashboard.tripId}/dashboards/${dashboardId}/groups`, groupId));
    }, [state.dashboards]);

    const saveCard = useCallback(async (tripId: string, card: Card) => {
        const { id: _, ...cardRest } = card;
        const cardData = cardRest as Record<string, unknown>;

        // Convert undefined values to deleteField() to remove them from Firestore
        const updates: Record<string, unknown> = {};
        Object.keys(cardData).forEach(key => {
            const value = cardData[key];
            if (value === undefined) {
                updates[key] = deleteField();
            } else {
                updates[key] = value;
            }
        });

        await setDoc(doc(db, `trips/${tripId}/cards`, card.id), updates, { merge: true });
    }, []);

    const deleteCard = useCallback(async (tripId: string, cardId: string) => {
        await deleteDoc(doc(db, `trips/${tripId}/cards`, cardId));
    }, []);

    const saveExpense = useCallback(async (tripId: string, expense: Expense) => {
        const { id: _, ...expenseRest } = expense;
        const expenseData = expenseRest as Record<string, unknown>;
        
        // Ensure tripId is set in the data
        expenseData.tripId = tripId;

        await setDoc(doc(db, `trips/${tripId}/expenses`, expense.id), expenseData, { merge: true });
    }, []);

    const deleteExpense = useCallback(async (tripId: string, expenseId: string) => {
        await deleteDoc(doc(db, `trips/${tripId}/expenses`, expenseId));
    }, []);

    return {
        ...state,
        saveTrip,
        deleteTrip,
        saveDashboard,
        deleteDashboard,
        saveGroup,
        deleteGroup,
        saveCard,
        deleteCard,
        saveExpense,
        deleteExpense,
    };
};
