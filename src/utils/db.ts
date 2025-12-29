import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Card, ExtraColumn, Trip, Dashboard, AccountSettings } from '@/types/kanban';
import { v4 as uuidv4 } from 'uuid';

interface NextStopDB extends DBSchema {
    cards: {
        key: string;
        value: Card;
    };
    extraColumns: {
        key: string;
        value: ExtraColumn;
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
    calendars: {
        key: string;
        value: { id: string; name: string };
    };
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
const DB_VERSION = 2;

export const dbPromise = openDB<NextStopDB>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
            db.createObjectStore('cards', { keyPath: 'id' });
            db.createObjectStore('extraColumns', { keyPath: 'id' });
            db.createObjectStore('calendars', { keyPath: 'id' });
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
            const calendarStore = transaction.objectStore('calendars');
            const cardStore = transaction.objectStore('cards');
            const extraColumnStore = transaction.objectStore('extraColumns');

            const calendars = await calendarStore.getAll();
            const allCards = await cardStore.getAll();
            const allExtraColumns = await extraColumnStore.getAll();

            // Cache for dashboard IDs mapping: calendarId -> dashboardId
            const calendarToDashboardMap: Record<string, string> = {};

            for (const cal of calendars) {
                // Create Trip
                const trip: Trip = {
                    id: cal.id, // Keep same ID for simplicity? Or new? Let's keep ID to preserve settings pointers if possible
                    name: cal.name,
                };
                await tripStore.put(trip);

                // Create Default Dashboard
                const dashboardId = uuidv4();
                calendarToDashboardMap[cal.id] = dashboardId;

                const dashboard: Dashboard = {
                    id: dashboardId,
                    tripId: trip.id,
                    name: 'Main Board',
                    days: 7
                };
                await dashboardStore.put(dashboard);
            }

            // Create default trip/dashboard if none existed (shouldn't happen if initialized, but safety)
            // REMOVED: We don't want to auto-create trips for new users.
            /* 
            if (calendars.length === 0) {
                const defaultTripId = '1';
                const defaultDashboardId = uuidv4();
                await tripStore.put({ id: defaultTripId, name: 'My Trip' });
                await dashboardStore.put({ id: defaultDashboardId, tripId: defaultTripId, name: 'Main Board', days: 7 });
                // Ensure settings point to this
                calendarToDashboardMap['1'] = defaultDashboardId; // fallback
            }
            */

            // Migrate Cards
            for (const card of allCards) {
                // @ts-ignore - accessing old property
                const oldCalId = card.calendarId;
                if (oldCalId && calendarToDashboardMap[oldCalId]) {
                    card.dashboardId = calendarToDashboardMap[oldCalId];
                    // @ts-ignore
                    delete card.calendarId;
                    await cardStore.put(card);
                } else if (!card.dashboardId) {
                    // Assign to first available dashboard or orphan?
                    // Pick first one from map
                    const firstDashId = Object.values(calendarToDashboardMap)[0];
                    if (firstDashId) {
                        card.dashboardId = firstDashId;
                        await cardStore.put(card);
                    }
                }
            }

            // Migrate Extra Columns
            // In v1 they didn't have dashboardId. Assign to ALL dashboards? 
            // Or just the first one?
            // "Extra columns" were likely global in the UI, but now they must belong to a dashboard.
            // Let's attach them to the FIRST dashboard of the FIRST trip found, to avoid duplication hell.
            // Or better: Leave them for now, they will filter out if not matching.
            // We must assign them a dashboardId for them to show up.
            const firstDashId = Object.values(calendarToDashboardMap)[0];
            if (firstDashId) {
                for (const col of allExtraColumns) {
                    col.dashboardId = firstDashId;
                    await extraColumnStore.put(col);
                }
            }

            // Note: We leave 'calendars' store for now, don't delete to avoid dataloss paranoia.
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

    async getExtraColumns(): Promise<ExtraColumn[]> {
        return (await dbPromise).getAll('extraColumns');
    },
    async saveExtraColumn(column: ExtraColumn): Promise<void> {
        await (await dbPromise).put('extraColumns', column);
    },
    async deleteExtraColumn(id: string): Promise<void> {
        await (await dbPromise).delete('extraColumns', id);
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
