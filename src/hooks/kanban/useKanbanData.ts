import { useState, useEffect } from 'react';
import { Card, ExtraColumn, Calendar, AccountSettings } from '@/types/kanban';
import { useSync } from '../../contexts/SyncContext';
import { useAuth } from '../../contexts/AuthContext';
import { db, dbPromise } from '@/utils/db'; // Import the db wrapper

const defaultExtraColumns: ExtraColumn[] = [
    { id: 'col1', name: 'Low Priority', order: 0 },
    { id: 'col2', name: 'Priorities', order: 1 },
    { id: 'col3', name: 'Shopping', order: 2 },
];

export const useKanbanData = () => {
    const { markDirty, initialFetch } = useSync();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    // State for all Kanban data
    const [cards, setCards] = useState<Card[]>([]);
    const [extraColumns, setExtraColumns] = useState<ExtraColumn[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [accountSettings, setAccountSettings] = useState<AccountSettings | null>(null);
    const [currentCalendarId, setCurrentCalendarId] = useState<string>('1');

    // Initial Data Fetch (DB or API)
    useEffect(() => {
        // if (!user) return; // Wait for user? Or load local first? 
        // Logic: Try to load from IndexedDB first for offline support, then sync if user is logged in.
        // For now, let's replicate the structure but use DB.

        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Load from IndexedDB
                const dbCards = await db.getAllCards();
                const dbExtraColumns = await db.getExtraColumns();
                const dbCalendars = await db.getCalendars();
                const dbSettings = await db.getAccountSettings();
                const dbCurrentCalendarId = await db.getLastCalendarId();

                setCards(dbCards);

                if (dbExtraColumns.length > 0) {
                    setExtraColumns(dbExtraColumns);
                } else {
                    setExtraColumns(defaultExtraColumns);
                    // Save defaults to DB
                    for (const col of defaultExtraColumns) {
                        await db.saveExtraColumn(col);
                    }
                }

                if (dbCalendars.length > 0) {
                    setCalendars(dbCalendars);
                } else {
                    const defaultCalendar = { id: '1', name: 'My Calendar' };
                    setCalendars([defaultCalendar]);
                    await db.saveCalendar(defaultCalendar);
                }

                if (dbSettings) {
                    setAccountSettings(dbSettings);
                } else {
                    const defaultSettings = {
                        defaultCalendarId: '1',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };
                    setAccountSettings(defaultSettings);
                    await db.saveAccountSettings(defaultSettings);
                }

                if (dbCurrentCalendarId) {
                    setCurrentCalendarId(dbCurrentCalendarId);
                }

                // 2. If user is logged in, sync with Firebase (Initial Fetch)
                if (user) {
                    const data = await initialFetch();
                    if (data) {
                        if (data.cards) {
                            setCards(data.cards);
                            // Update DB
                            await db.clearCards();
                            for (const c of data.cards) await db.addCard(c);
                        }
                        if (data.extraColumns && data.extraColumns.length > 0) {
                            setExtraColumns(data.extraColumns);
                            // Update DB (simplified for now, might need diffing in real app)
                            for (const c of data.extraColumns) await db.saveExtraColumn(c);
                        }
                        if (data.calendars && data.calendars.length > 0) {
                            setCalendars(data.calendars);
                            for (const c of data.calendars) await db.saveCalendar(c);
                        }
                        if (data.accountSettings) {
                            setAccountSettings(data.accountSettings);
                            await db.saveAccountSettings(data.accountSettings);
                        }
                    }
                }

            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [initialFetch, user]); // Depend on user to trigger sync when login status changes

    // Persistence Effects (IndexedDB)
    // Using effects to save changes to DB. 
    // Note: This might be slightly inefficient for large arrays as it overwrites everything. 
    // Ideally, operations should update DB directly, but to keep 'useKanbanData' structure similar for now:

    // Optimization: Only update DB when state changes. 
    // Ideally, we move DB updates to the operations hooks (addCard, etc.), but to allow existing setCards to work:

    // NOTE: React strict mode might trigger this twice. 
    // For arrays, we probably shouldn't just dump the whole array every time if we want to be efficient,
    // but for migration this ensures consistency.

    // However, since we define 'cards' as the single source of truth in state, 
    // writing the whole array to IDB 'put' (upsert) is okay-ish for small datasets.
    // But 'clearCards' then 'saveAll' is dangerous if state is partial.

    // Better strategy for this Hook replacement:
    // The previous code using localStorage.setItem(JSON.stringify(cards)) implies full rewrite.
    // I will replicate that behavior with IDB for now to minimize refactor risk.

    useEffect(() => {
        if (!isLoading) {
            const save = async () => {
                // To match localStorage behavior of "replacing" the list:
                // We need to ensure we don't just append. 
                // But clearing and rewriting every keystroke is bad.
                // The previous code was: localStorage.setItem('kanban_cards', JSON.stringify(cards));

                // For IDB, let's try to be smart or just do the bulk put. 
                // Bulk put is fine. The issue is deletions.
                // if I remove a card from state, and only call .put(), the old card remains in DB.

                // So, to truly replicate "state is source of truth", we ideally clear and rewrite, OR verify deletions.
                // Given the task size, I will clear and rewrite for 'cards' if the array length varies significantly, 
                // OR just clear and rewrite always (simplest, same perf profile as localStorage stringify).

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
                // For extra columns, usually few items
                // We can't easily "clear" if we want to keep keys, but usually we just overwrite.
                // Let's manually manage deletion if needed, but for now:
                const existing = await db.getExtraColumns();
                // If extraColumns is empty but DB has stuff, we might have an issue? 
                // No, state is truth.

                // Simplest: 
                const currentIds = new Set(extraColumns.map(c => c.id));
                for (const e of existing) {
                    if (!currentIds.has(e.id)) {
                        await db.deleteExtraColumn(e.id);
                    }
                }
                for (const c of extraColumns) {
                    await db.saveExtraColumn(c);
                }
            };
            save();
        }
    }, [extraColumns, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            const save = async () => {
                const existing = await db.getCalendars();
                const currentIds = new Set(calendars.map(c => c.id));
                for (const e of existing) {
                    if (!currentIds.has(e.id)) {
                        await db.deleteCalendar(e.id);
                    }
                }
                for (const c of calendars) {
                    await db.saveCalendar(c);
                }
            };
            save();
        }
    }, [calendars, isLoading]);

    useEffect(() => {
        if (accountSettings && !isLoading) {
            db.saveAccountSettings(accountSettings);
        }
    }, [accountSettings, isLoading]);

    useEffect(() => {
        if (currentCalendarId && !isLoading) {
            db.saveLastCalendarId(currentCalendarId);
        }
    }, [currentCalendarId, isLoading]);

    return {
        cards,
        setCards,
        extraColumns,
        setExtraColumns,
        calendars,
        setCalendars,
        accountSettings,
        setAccountSettings,
        currentCalendarId,
        setCurrentCalendarId,
        isLoading,
        markDirty
    };
};
