
export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string; // 'BRL', 'USD', 'EUR', etc.
  
  // Installment Logic
  installments: number; // 1 means one-time payment
  startDate: string; // ISO Date string (YYYY-MM-DD) for when the first payment/installment occurs
  
  // Payer & Split Logic
  payerId: string; // User ID (email or uid) who paid the bill
  involvedUserIds: string[]; // List of User IDs involved in the split (including payer if they are involved)
  
  // Split Strategy (for future proofing, default to 'equal' for now)
  splitType?: 'equal' | 'percentage'; 
  splitRatios?: Record<string, number>; // key: userId, value: percentage (e.g. 50, 30, 20)

  createdAt: string;
  createdBy: string;
}

export interface MonthlyDebt {
  debtorId: string;
  creditorId: string;
  amount: number;
  currency: string;
}

export interface MonthlyBalance {
  month: string; // YYYY-MM
  debts: MonthlyDebt[];
}
