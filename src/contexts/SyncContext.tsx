import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface DirtyItem {
    id: string;
    collection: string;
}

interface SyncContextType {
    isSyncing: boolean;
    lastSyncedAt: Date | null;
    pendingChanges: number;
    isOnline: boolean;
    markDirty: (id: string, collectionName: string) => void;
    forceSync: () => Promise<void>;
    initialFetch: () => Promise<any>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode; getState: () => any }> = ({ children, getState }) => {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [dirtyItems, setDirtyItems] = useState<DirtyItem[]>(() => {
        const saved = localStorage.getItem('sync_dirty_items');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Persist dirty items
    useEffect(() => {
        if (user) localStorage.setItem('sync_dirty_items', JSON.stringify(dirtyItems));
    }, [dirtyItems, user]);

    const markDirty = useCallback((id: string, collectionName: string) => {
        if (import.meta.env.VITE_DISABLE_FIREBASE === 'true') return;

        setDirtyItems(prev => {
            // Avoid duplicates
            if (prev.some(item => item.id === id && item.collection === collectionName)) {
                return prev;
            }
            return [...prev, { id, collection: collectionName }];
        });
    }, []);

    const initialFetch = useCallback(async () => {
        if (import.meta.env.VITE_DISABLE_FIREBASE === 'true') return {};
        if (!user) return {};

        try {
            setIsSyncing(true);
            const collectionsToFetch = ['cards', 'recurringTasks', 'extraColumns', 'calendars', 'accountSettings'];
            const data: any = {};

            for (const colName of collectionsToFetch) {
                const querySnapshot = await getDocs(collection(db, `users/${user.uid}/${colName}`));
                const items: any[] = [];
                querySnapshot.forEach((doc) => {
                    items.push(doc.data());
                });

                if (colName === 'accountSettings') {
                    data[colName] = items.length > 0 ? items[0] : null;
                } else {
                    data[colName] = items;
                }
            }

            setLastSyncedAt(new Date());
            return data;
        } catch (error) {
            console.error("Error fetching initial data:", error);
            toast.error("Failed to load data from server");
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, [user]);

    const forceSync = useCallback(async () => {
        if (import.meta.env.VITE_DISABLE_FIREBASE === 'true') return;
        if (!user) return;
        if (dirtyItems.length === 0) return;
        if (isSyncing) return;
        if (!isOnline) {
            toast.error("Cannot sync while offline");
            return;
        }

        setIsSyncing(true);
        const currentDirtyItems = [...dirtyItems]; // Snapshot
        const state = getState(); // Get current app state to find objects

        try {
            // Process all dirty items
            const promises = currentDirtyItems.map(async (item) => {
                let dataToSave = null;

                // Find the item in the state
                if (item.collection === 'cards') {
                    dataToSave = state.cards.find((c: any) => c.id === item.id);
                } else if (item.collection === 'recurringTasks') {
                    dataToSave = state.recurringTasks.find((t: any) => t.id === item.id);
                } else if (item.collection === 'extraColumns') {
                    dataToSave = state.extraColumns.find((c: any) => c.id === item.id);
                } else if (item.collection === 'calendars') {
                    dataToSave = state.calendars.find((c: any) => c.id === item.id);
                } else if (item.collection === 'accountSettings') {
                    dataToSave = state.accountSettings;
                }

                const docRef = doc(db, `users/${user.uid}/${item.collection}`, item.id);

                if (dataToSave) {
                    // Upsert
                    // Firestore doesn't support undefined values, so we sanitize the data
                    const sanitizedData = JSON.parse(JSON.stringify(dataToSave));
                    await setDoc(docRef, sanitizedData);
                } else {
                    // Delete (if not found in state, it implies deletion)
                    await deleteDoc(docRef);
                }
            });

            await Promise.all(promises);

            // Remove processed items from dirty list
            setDirtyItems(prev => prev.filter(item =>
                !currentDirtyItems.some(processed => processed.id === item.id && processed.collection === item.collection)
            ));

            setLastSyncedAt(new Date());
        } catch (error) {
            console.error("Sync error:", error);
            toast.error("Sync failed");
        } finally {
            setIsSyncing(false);
        }
    }, [dirtyItems, isSyncing, isOnline, getState, user]);

    // Auto-sync interval and force sync on threshold
    useEffect(() => {
        if (dirtyItems.length > 5) {
            forceSync();
        }

        const interval = setInterval(() => {
            if (dirtyItems.length > 0) {
                forceSync();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [dirtyItems, forceSync]);
    // Better implementation for interval to avoid stale closures:
    const dirtyItemsRef = useRef(dirtyItems);
    dirtyItemsRef.current = dirtyItems;

    // We need a ref for isSyncing too to avoid race conditions in interval
    const isSyncingRef = useRef(isSyncing);
    isSyncingRef.current = isSyncing;

    // Actually, the simplest way is to just let the effect run. 
    // But since forceSync depends on state, we need to be careful.
    // Let's rely on the fact that forceSync uses the *current* state from getState() 
    // and the *current* dirtyItems from the state setter or a ref.

    // Let's use a separate effect for the interval that calls a ref-wrapped function
    const forceSyncRef = useRef(forceSync);
    forceSyncRef.current = forceSync;

    useEffect(() => {
        const interval = setInterval(() => {
            forceSyncRef.current();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <SyncContext.Provider value={{
            isSyncing,
            lastSyncedAt,
            pendingChanges: dirtyItems.length,
            isOnline,
            markDirty,
            forceSync,
            initialFetch
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};
