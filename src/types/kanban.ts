export interface Card {
  id: string;
  title: string;
  date?: string; // ISO date string for day columns
  columnType?: 'day' | 'extra'; // day for weekday columns, extra for custom columns
  extraColumnId?: string; // for cards in extra columns
  description?: string; // Detailed description

  order?: number; // Sort order within its column
  color?: string; // Custom card color
  notes?: string; // Additional notes
  completed?: boolean; // Task completion status
  completedAt?: string; // ISO date string when task was completed
  time?: string; // Optional time for the card (HH:mm)
  createdAt: string;
  calendarId?: string;
}

export interface ExtraColumn {
  id: string;
  name: string;
  order: number;
}

export interface WeekData {
  startDate: Date;
  endDate: Date;
}



export interface Calendar {
  id: string;
  name: string;
}

export interface AccountSettings {
  defaultCalendarId: string;
  timezone?: string;
  customColors?: string[];
}
