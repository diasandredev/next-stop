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

export const dbPromise = openDB<NextStopDB>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
            db.createObjectStore('cards', { keyPath: 'id' });
            db.createObjectStore('settings');
            db.createObjectStore('meta');
        }

        if (oldVersion < 2) {
            // Migration v1 -> v2
            const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
            const dashboardStore = db.createObjectStore('dashboards', { keyPath: 'id' });

            // Migrate Calendars -> Trips
            // read from 'calendars' store
            // We can access existing stores via transaction
            // Removed legacy stores logic to avoid errors if stores don't exist in fresh state
            // But for migration, we might need to be careful. 
            // If stores are deleted, we can't migrate.
            // Assuming user wants clean break or has already migrated.
            // Let's remove migration logic that depends on deleted stores.

            const cardStore = transaction.objectStore('cards');

            // Removed legacy migration logic
            const firstDashId = undefined; // Placeholder if logic needed it

            // Note: We leave 'calendars' store for now, don't delete to avoid dataloss paranoia.
        }

        if (oldVersion < 3) {
            // Delete legacy stores
            if (db.objectStoreNames.contains('extraColumns')) {
                db.deleteObjectStore('extraColumns' as any);
            }
            if (db.objectStoreNames.contains('calendars')) {
                db.deleteObjectStore('calendars' as any);
            }
        }
    },
});

export const db = {
    async getAllCards(): Promise<Card[]> {
        return (await dbPromise).getAll('cards');
    },
    async addCard(card: Card): Promise<string> {
        await (await dbPromise).put('cards', card);
        return card.id;
    },
    async updateCard(card: Card): Promise<string> {
        await (await dbPromise).put('cards', card);
        return card.id;
    },
    async deleteCard(id: string): Promise<void> {
        await (await dbPromise).delete('cards', id);
    },
    async clearCards(): Promise<void> {
        await (await dbPromise).clear('cards');
    },

    // Trips
    async getTrips(): Promise<Trip[]> {
        return (await dbPromise).getAll('trips');
    },
    async saveTrip(trip: Trip): Promise<void> {
        await (await dbPromise).put('trips', trip);
    },
    async deleteTrip(id: string): Promise<void> {
        await (await dbPromise).delete('trips', id);
    },

    // Dashboards
    async getDashboards(): Promise<Dashboard[]> {
        return (await dbPromise).getAll('dashboards');
    },
    async saveDashboard(dashboard: Dashboard): Promise<void> {
        await (await dbPromise).put('dashboards', dashboard);
    },
    async deleteDashboard(id: string): Promise<void> {
        await (await dbPromise).delete('dashboards', id);
    },

    // Account Settings
    async getAccountSettings(): Promise<AccountSettings | undefined> {
        return (await dbPromise).get('settings', 'accountSettings');
    },
    async saveAccountSettings(settings: AccountSettings): Promise<void> {
        await (await dbPromise).put('settings', settings, 'accountSettings');
    },

    // Meta
    async getLastTripId(): Promise<string | undefined> {
        return (await dbPromise).get('meta', 'currentTripId'); // renamed key
    },
    async saveLastTripId(id: string): Promise<void> {
        await (await dbPromise).put('meta', id, 'currentTripId');
    }
};
