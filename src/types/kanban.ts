export interface Card {
  id: string;
  title: string;
  icon?: string; // Optional emoji icon
  date?: string; // ISO date string for day columns
  description?: string; // Detailed description

  // Options/Branching support
  type?: 'default' | 'options';
  parentId?: string; // If this card belongs to an option group
  optionId?: string; // Which specific option/branch this card belongs to (e.g. 'option-1', 'option-2')

  order?: number; // Sort order within its column
  columnType?: 'day' | 'extra'; // Type of column the card belongs to
  groupId?: string; // If this card belongs to a group in the right sidebar
  color?: string; // Custom card color
  notes?: string; // Additional notes
  completed?: boolean; // Task completion status
  completedAt?: string; // ISO date string when task was completed
  time?: string; // Optional time for the card (HH:mm)
  createdAt: string;
  dashboardId?: string;

  // Authorship tracking
  createdBy?: string; // Email of creator
  lastEditedBy?: string; // Email of last editor
  lastEditedAt?: string; // ISO timestamp of last edit

  // Location Integration
  location?: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
}



export interface WeekData {
  startDate: Date;
  endDate: Date;
}

export interface TripShare {
  email: string;
  permission: 'view' | 'edit';
  addedAt: string; // ISO timestamp
  addedBy: string; // Email of who added the share
}

export interface Trip {
  id: string;
  name: string;
  ownerId?: string; // Firebase UID of owner
  sharedWith?: TripShare[]; // List of shares
  startDate?: string; // ISO Date string
  endDate?: string; // ISO Date string
}

export interface Dashboard {
  id: string;
  tripId: string;
  name: string;
  days: number; // Default 7 if undefined
  startDate?: string; // ISO Date string
  backgroundColor?: string; // Hex color for dashboard background
  createdAt?: string;
}

export interface AccountSettings {
  defaultTripId: string;
  timezone?: string;
  customColors?: string[];
  recentIcons?: string[];
}

