import { Expense, MonthlyBalance, MonthlyDebt } from '@/types/finance';
import { Trip } from '@/types/kanban';
import { differenceInMonths, parseISO, startOfMonth, addMonths, format } from 'date-fns';

/**
 * Calculates the debts for a specific month based on installments.
 * 
 * Logic:
 * 1. Filter expenses that are active in the target month.
 *    - An expense is active if: 
 *      targetMonth >= expense.startDate AND
 *      targetMonth < expense.startDate + installments
 * 2. For each active expense:
 *    - Monthly Amount = Total Amount / Installments
 *    - If splitType is 'equal' (default):
 *      - Split Amount = Monthly Amount / involvedUserIds.length
 *      - The Payer is "owed" (Split Amount * (involvedUserIds.length - 1)) effectively,
 *        but simpler: Each non-payer involved user owes the payer (Split Amount).
 *    - If the Payer is NOT in involvedUserIds (e.g. paid for others entirely):
 *      - Each involved user owes the payer (Monthly Amount / involvedUserIds.length).
 * 3. Aggregate debts by currency and debtor/creditor pair.
 */
export const calculateMonthlyBalances = (
    expenses: Expense[],
    targetMonthStr: string, // YYYY-MM
    trip: Trip
): MonthlyBalance => {
    const targetDate = parseISO(`${targetMonthStr}-01`);
    const debts: MonthlyDebt[] = [];

    expenses.forEach(expense => {
        // 1. Check if expense is active in this month
        const startDate = parseISO(expense.startDate);
        const startMonth = startOfMonth(startDate);
        
        // Month difference: if expense starts in Jan (0) and we are in Jan (0), diff is 0.
        // If 10 installments, valid diffs are 0 to 9.
        const monthDiff = differenceInMonths(targetDate, startMonth);

        if (monthDiff >= 0 && monthDiff < expense.installments) {
            // It's active!
            
            // 2. Calculate Monthly Amount
            const monthlyAmount = expense.amount / expense.installments;

            // 3. Determine Debts
            // Defaulting to equal split for now
            const splitCount = expense.involvedUserIds.length;
            if (splitCount === 0) return; // Should not happen

            const creditorId = expense.payerId;

            if (expense.splitType === 'percentage' && expense.splitRatios) {
                // Percentage Split Logic
                expense.involvedUserIds.forEach(involvedUserId => {
                    // Skip creditor (payer) as they don't owe themselves
                    if (involvedUserId !== creditorId) {
                        const ratio = expense.splitRatios![involvedUserId] || 0;
                        const debtAmount = (monthlyAmount * ratio) / 100;

                        if (debtAmount > 0) {
                             debts.push({
                                debtorId: involvedUserId,
                                creditorId: creditorId,
                                amount: debtAmount,
                                currency: expense.currency
                            });
                        }
                    }
                });
            } else {
                // Equal Split Logic (Default)
                const amountPerPerson = monthlyAmount / splitCount;
    
                expense.involvedUserIds.forEach(involvedUserId => {
                    if (involvedUserId !== creditorId) {
                        // This person owes the payer
                        debts.push({
                            debtorId: involvedUserId,
                            creditorId: creditorId,
                            amount: amountPerPerson,
                            currency: expense.currency
                        });
                    }
                });
            }
        }
    });

    // 4. Aggregate Debts (Simplify: A owes B 10, B owes A 5 -> A owes B 5)
    // First, sum up all raw debts
    const aggregatedDebts: Record<string, number> = {}; // key: "debtor-creditor-currency", value: amount

    debts.forEach(debt => {
        const key = `${debt.debtorId}-${debt.creditorId}-${debt.currency}`;
        const reverseKey = `${debt.creditorId}-${debt.debtorId}-${debt.currency}`;

        if (aggregatedDebts[key]) {
            aggregatedDebts[key] += debt.amount;
        } else if (aggregatedDebts[reverseKey]) {
            // Optimization: subtract from reverse debt instead of adding new forward debt?
            // Actually, let's just sum everything first, then simplify.
            // Simpler map: map[currency][userA][userB] = netFlow
            // Let's stick to the list for a sec.
             aggregatedDebts[key] = (aggregatedDebts[key] || 0) + debt.amount;
        } else {
             aggregatedDebts[key] = debt.amount;
        }
    });

    // Simplify Logic:
    // We need a structure: balances[currency][user] = net value (positive = receives, negative = owes)
    // Actually the requirement is "A owes B".
    
    // Let's use a net matrix per currency
    const netMatrix: Record<string, Record<string, Record<string, number>>> = {}; 
    // netMatrix['BRL']['userA']['userB'] = amount A owes B

    debts.forEach(debt => {
        if (!netMatrix[debt.currency]) netMatrix[debt.currency] = {};
        if (!netMatrix[debt.currency][debt.debtorId]) netMatrix[debt.currency][debt.debtorId] = {};
        
        // Initialize if not exists
        if (!netMatrix[debt.currency][debt.debtorId][debt.creditorId]) {
            netMatrix[debt.currency][debt.debtorId][debt.creditorId] = 0;
        }
        
        netMatrix[debt.currency][debt.debtorId][debt.creditorId] += debt.amount;
    });

    // Now resolve mutual debts
    // If A owes B 100 and B owes A 40, then A owes B 60.
    const finalDebts: MonthlyDebt[] = [];

    Object.keys(netMatrix).forEach(currency => {
        const users = Object.keys(netMatrix[currency]);
        // We need to iterate all pairs.
        // To avoid duplicates, we can collect all involved users in this currency
        
        // Let's just iterate the matrix we built
        // But the matrix is sparse.
        
        // Better approach:
        // Calculate Net Balance for each user.
        // NO, the user wants "Who owes Whom", not just "I am -500 overall".
        // Though "Who owes Whom" is usually derived from minimizing transactions.
        // But for this specific requirement "X paid for Y", we often want to keep the direct link?
        // Usually, simplified debts are better. "A owes B".
        
        // Let's simplify A->B and B->A pairs.
        // We need a list of all pairs found.
        const pairs = new Set<string>();
        debts.forEach(d => {
            const u1 = d.debtorId < d.creditorId ? d.debtorId : d.creditorId;
            const u2 = d.debtorId < d.creditorId ? d.creditorId : d.debtorId;
            pairs.add(`${u1}|${u2}`);
        });

        pairs.forEach(pair => {
            const [u1, u2] = pair.split('|');
            
            // Calc A->B
            let u1OwesU2 = 0;
            if (netMatrix[currency][u1] && netMatrix[currency][u1][u2]) {
                u1OwesU2 = netMatrix[currency][u1][u2];
            }

            // Calc B->A
            let u2OwesU1 = 0;
             if (netMatrix[currency][u2] && netMatrix[currency][u2][u1]) {
                u2OwesU1 = netMatrix[currency][u2][u1];
            }

            const net = u1OwesU2 - u2OwesU1;
            if (net > 0.01) {
                finalDebts.push({
                    debtorId: u1,
                    creditorId: u2,
                    amount: net,
                    currency
                });
            } else if (net < -0.01) {
                finalDebts.push({
                    debtorId: u2,
                    creditorId: u1,
                    amount: Math.abs(net),
                    currency
                });
            }
        });
    });

    return {
        month: targetMonthStr,
        debts: finalDebts
    };
};
