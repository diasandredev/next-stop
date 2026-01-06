import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card, Trip, Dashboard, AccountSettings } from '@/types/kanban';
import { v4 as uuidv4 } from 'uuid';

interface NextStopDB extends DBSchema {
    cards: {
        key: string;
        value: Card;
    };
    trips: {
        key: string;
        value: Trip;
    };
    dashboards: {
        key: string;
        value: Dashboard;
    };
    // Legacy store for migration, will be deleted or ignored
    // tables removed

    settings: {
        key: string; // 'accountSettings'
        value: AccountSettings;
    };
    meta: {
        key: string;
        value: any;
    }
}

const DB_NAME = 'next-stop-db';
const DB_VERSION = 3;

let _dbPromise: Promise<NextStopDB> | null = null; // Type IDBPDatabase<NextStopDB> but Promise wrapper

function getDB() {
    if (!_dbPromise) {
        _dbPromise = openDB<NextStopDB>(DB_NAME, DB_VERSION, {
            async upgrade(db, oldVersion, newVersion, transaction) {
                if (oldVersion < 1) {
                    db.createObjectStore('cards', { keyPath: 'id' });
                    db.createObjectStore('settings');
                    db.createObjectStore('meta');
                }

                if (oldVersion < 2) {
                    // Migration v1 -> v2
                    db.createObjectStore('trips', { keyPath: 'id' });
                    db.createObjectStore('dashboards', { keyPath: 'id' });
                }

                if (oldVersion < 3) {
                    // Delete legacy stores
                    if (db.objectStoreNames.contains('extraColumns' as any)) {
                        db.deleteObjectStore('extraColumns' as any);
                    }
                    if (db.objectStoreNames.contains('calendars' as any)) {
                        db.deleteObjectStore('calendars' as any);
                    }
                }
            },
            terminated() {
                // Formatting this correctly
                _dbPromise = null;
            },
        });
    }
    return _dbPromise;
}

export const dbPromise = getDB(); // Legacy export, but we should use getDB() internal logic if possible.
// Actually, since dbPromise is a const, it won't be updated if _dbPromise is reset.
// We should discourage use of dbPromise externaly.

export const db = {
    async getAllCards(): Promise<Card[]> {
        return (await getDB()).getAll('cards');
    },
    async addCard(card: Card): Promise<string> {
        await (await getDB()).put('cards', card);
        return card.id;
    },
    async updateCard(card: Card): Promise<string> {
        await (await getDB()).put('cards', card);
        return card.id;
    },
    async deleteCard(id: string): Promise<void> {
        await (await getDB()).delete('cards', id);
    },
    async clearCards(): Promise<void> {
        await (await getDB()).clear('cards');
    },
    async syncCards(cards: Card[]): Promise<void> {
        const db = await getDB();
        const tx = db.transaction('cards', 'readwrite');
        const store = tx.objectStore('cards');
        await store.clear();
        for (const card of cards) {
            await store.put(card);
        }
        await tx.done;
    },

    // Trips
    async getTrips(): Promise<Trip[]> {
        return (await getDB()).getAll('trips');
    },
    async saveTrip(trip: Trip): Promise<void> {
        await (await getDB()).put('trips', trip);
    },
    async deleteTrip(id: string): Promise<void> {
        await (await getDB()).delete('trips', id);
    },
    async syncTrips(trips: Trip[]): Promise<void> {
        const db = await getDB();
        const tx = db.transaction('trips', 'readwrite');
        const store = tx.objectStore('trips');

        // 1. Get all existing keys
        const existingKeys = await store.getAllKeys();
        const incomingIds = new Set(trips.map(t => t.id));

        // 2. Delete those not in incoming
        for (const key of existingKeys) {
            if (!incomingIds.has(key)) {
                await store.delete(key);
            }
        }

        // 3. Put incoming
        for (const trip of trips) {
            await store.put(trip);
        }

        await tx.done;
    },

    // Dashboards
    async getDashboards(): Promise<Dashboard[]> {
        return (await getDB()).getAll('dashboards');
    },
    async saveDashboard(dashboard: Dashboard): Promise<void> {
        await (await getDB()).put('dashboards', dashboard);
    },
    async deleteDashboard(id: string): Promise<void> {
        await (await getDB()).delete('dashboards', id);
    },
    async syncDashboards(dashboards: Dashboard[]): Promise<void> {
        const db = await getDB();
        const tx = db.transaction('dashboards', 'readwrite');
        const store = tx.objectStore('dashboards');

        const existingKeys = await store.getAllKeys();
        const incomingIds = new Set(dashboards.map(d => d.id));

        for (const key of existingKeys) {
            if (!incomingIds.has(key)) {
                await store.delete(key);
            }
        }

        for (const d of dashboards) {
            await store.put(d);
        }

        await tx.done;
    },

    // Account Settings
    async getAccountSettings(): Promise<AccountSettings | undefined> {
        return (await getDB()).get('settings', 'accountSettings');
    },
    async saveAccountSettings(settings: AccountSettings): Promise<void> {
        await (await getDB()).put('settings', settings, 'accountSettings');
    },

    // Meta
    async getLastTripId(): Promise<string | undefined> {
        return (await getDB()).get('meta', 'currentTripId'); // renamed key
    },
    async saveLastTripId(id: string): Promise<void> {
        await (await getDB()).put('meta', id, 'currentTripId');
    },

    async clearAll(): Promise<void> {
        const database = await getDB();
        const objectStoreNames = database.objectStoreNames;
        const tx = database.transaction(objectStoreNames, 'readwrite');
        const promises: Promise<void>[] = [];

        for (const storeName of objectStoreNames) {
            promises.push(tx.objectStore(storeName).clear());
        }

        await Promise.all(promises);
        await tx.done;
    }
};
