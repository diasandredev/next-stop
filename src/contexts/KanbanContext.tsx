import React, { createContext, useContext } from 'react';
import { Card, ExtraColumn, Calendar, AccountSettings } from '@/types/kanban';

export interface KanbanContextType {
  cards: Card[];
  extraColumns: ExtraColumn[];

  calendars: Calendar[];
  currentCalendarId: string;
  accountSettings: AccountSettings | null;
  isLoading: boolean;
  addCard: (card: Omit<Card, 'id' | 'createdAt'>) => void;

  updateCard: (id: string, card: Partial<Card>) => void;

  deleteCard: (id: string) => void;
  deleteAllCards: () => void;

  updateExtraColumn: (id: string, name: string) => void;

  addCalendar: (name: string) => void;
  updateCalendar: (id: string, updates: Partial<Calendar>) => void;
  deleteCalendar: (id: string) => void;
  setCurrentCalendarId: (id: string) => void;
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