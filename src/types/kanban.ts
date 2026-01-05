export interface Card {
  id: string;
  title: string;
  date?: string; // ISO date string for day columns
  columnType?: 'day' | 'extra'; // day for weekday columns, extra for custom columns
  extraColumnId?: string; // for cards in extra columns
  description?: string; // Detailed description

  // Options/Branching support
  type?: 'default' | 'options';
  parentId?: string; // If this card belongs to an option group
  optionId?: string; // Which specific option/branch this card belongs to (e.g. 'option-1', 'option-2')

  order?: number; // Sort order within its column
  color?: string; // Custom card color
  notes?: string; // Additional notes
  completed?: boolean; // Task completion status
  completedAt?: string; // ISO date string when task was completed
  time?: string; // Optional time for the card (HH:mm)
  createdAt: string;
  dashboardId?: string;

  // Location Integration
  location?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
}

export interface ExtraColumn {
  id: string;
  dashboardId: string; // Link to a specific dashboard
  name: string;
  order: number;
}

export interface WeekData {
  startDate: Date;
  endDate: Date;
}

export interface Trip {
  id: string;
  name: string;
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
}

export interface Dashboard {
  id: string;
  tripId: string;
  name: string;
  days: number; // Default 7 if undefined
  startDate?: string; // ISO Date string
  createdAt?: string;
}

export interface AccountSettings {
  defaultTripId: string;
  timezone?: string;
  customColors?: string[];
}
