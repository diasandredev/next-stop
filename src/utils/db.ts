import { openDB, DBSchema } from 'idb';
import { Card, ExtraColumn, Calendar, AccountSettings } from '@/types/kanban';

interface NextStopDB extends DBSchema {
    cards: {
        key: string;
        value: Card;
    };
    extraColumns: {
        key: string;
        value: ExtraColumn;
    };
    calendars: {
        key: string;
        value: Calendar;
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
const DB_VERSION = 1;

export const dbPromise = openDB<NextStopDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
        db.createObjectStore('cards', { keyPath: 'id' });
        db.createObjectStore('extraColumns', { keyPath: 'id' });
        db.createObjectStore('calendars', { keyPath: 'id' });
        db.createObjectStore('settings');
        db.createObjectStore('meta');
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

    async getCalendars(): Promise<Calendar[]> {
        return (await dbPromise).getAll('calendars');
    },
    async saveCalendar(calendar: Calendar): Promise<void> {
        await (await dbPromise).put('calendars', calendar);
    },
    async deleteCalendar(id: string): Promise<void> {
        await (await dbPromise).delete('calendars', id);
    },

    async getAccountSettings(): Promise<AccountSettings | undefined> {
        return (await dbPromise).get('settings', 'accountSettings');
    },
    async saveAccountSettings(settings: AccountSettings): Promise<void> {
        await (await dbPromise).put('settings', settings, 'accountSettings');
    },

    async getLastCalendarId(): Promise<string | undefined> {
        return (await dbPromise).get('meta', 'currentCalendarId');
    },
    async saveLastCalendarId(id: string): Promise<void> {
        await (await dbPromise).put('meta', id, 'currentCalendarId');
    }
};
