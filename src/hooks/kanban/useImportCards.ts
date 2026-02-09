import { useCallback } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { cardImportSchema, importFileSchema } from '@/schemas/importCards';
import { parseISO, addDays, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { Card } from '@/types/kanban';

export const useImportCards = () => {
    const { addCard } = useKanban();

    const importCards = useCallback(async (
        jsonData: string,
        dashboardId: string,
        startDate?: string,
        days: number = 1
    ) => {
        const warnings: string[] = [];
        const errors: string[] = [];
        let importedCount = 0;

        try {
            let parsed;
            try {
                parsed = JSON.parse(jsonData);
            } catch (e) {
                return { importedCount: 0, warnings, errors: ["Invalid JSON format"] };
            }

            const result = importFileSchema.safeParse(parsed);

            if (!result.success) {
                const issues = result.error.issues.map(issue => 
                    `Validation error: ${issue.message} at ${issue.path.join('.')}`
                );
                return { importedCount: 0, warnings, errors: issues };
            }

            const { cards } = result.data;

            // Calculate valid date range
            let validStart: Date | null = null;
            let validEnd: Date | null = null;

            if (startDate) {
                validStart = startOfDay(parseISO(startDate));
                // "days" includes the start date, so add days-1
                const endDate = addDays(validStart, Math.max(0, days - 1));
                validEnd = endOfDay(endDate);
            }

            for (const cardData of cards) {
                // Date validation logic
                if (validStart && validEnd) {
                    const cardDate = parseISO(cardData.date);

                    // Check if date is within range
                    // We compare start of card date with valid range
                    const cardStart = startOfDay(cardDate);

                    if (isBefore(cardStart, validStart) || isAfter(cardStart, validEnd)) {
                        warnings.push(`Card "${cardData.title}" skipped: Date ${cardData.date} is outside dashboard range.`);
                        continue;
                    }
                }

                try {
                    // Prepare card object
                    const newCard: Omit<Card, 'id' | 'createdAt'> = {
                        title: cardData.title,
                        date: cardData.date,
                        order: cardData.order,
                        description: cardData.description,
                        time: cardData.time,
                        icon: cardData.icon,
                        notes: cardData.notes,
                        cost: cardData.cost,
                        currency: cardData.currency,
                        dashboardId,
                        columnType: 'day',
                        type: 'default',
                        completed: false,
                        location: cardData.location ? {
                            name: cardData.location.name,
                            address: cardData.location.address,
                            lat: cardData.location.lat,
                            lng: cardData.location.lng,
                            placeId: cardData.location.placeId || crypto.randomUUID()
                        } : undefined,
                        checklist: cardData.checklist?.map(item => ({
                            id: crypto.randomUUID(),
                            text: item.text,
                            completed: item.completed
                        })),
                    };

                    addCard(newCard);
                    importedCount++;
                } catch (err) {
                    errors.push(`Failed to add card "${cardData.title}": ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

        } catch (e) {
            errors.push(`Unexpected error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }

        return { importedCount, warnings, errors };
    }, [addCard]);

    return { importCards };
};
