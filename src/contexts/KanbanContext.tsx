import React, { createContext, useContext } from 'react';
import { Card, ExtraColumn, Trip, Dashboard, AccountSettings } from '@/types/kanban';

export interface KanbanContextType {
  cards: Card[];
  extraColumns: ExtraColumn[];

  trips: Trip[];
  dashboards: Dashboard[];
  currentTripId: string;
  accountSettings: AccountSettings | null;
  isLoading: boolean;

  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  deleteAllCards: () => void;

  updateExtraColumn: (id: string, name: string) => void;

  addTrip: (name: string, startDate?: string, endDate?: string) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  setCurrentTripId: (id: string) => void;

  addDashboard: (tripId: string, name: string, startDate?: string, days?: number) => void;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;

  updateAccountSettings: (settings: Partial<AccountSettings>) => void;
  addCustomColor: (color: string) => void;
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

export const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};