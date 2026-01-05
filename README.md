# Next Stop

Next Stop is a comprehensive travel planning application designed to help you organize your trips with ease. It combines a powerful Kanban board for daily itineraries with map integration and real-time synchronization.

## Features

### ✈️ Trip Management
- **Create Trips**: Organize your travels into distinct trips.
- **Dashboards**: Each trip can have multiple dashboards, representing days or phases of your trip.
- **Kanban Flow**: Drag and drop cards to organize activities, spots to visit, and reservations.

### 🗺️ Map Integration
- **Interactive Map**: Visualize your trip with an integrated map view (powered by MapLibre/React Map GL).
- **Location Search**: Easily search for locations and add them to your itinerary.

### 🔄 Real-time Sync & Offline Support
- **Firebase Backend**: Your data is securely stored and synced across devices in real-time.
- **Offline Capable**: Continue planning even without an internet connection; changes sync automatically when you're back online.

### 🎨 Modern UI
- **Responsive Design**: Built for desktop and tablet usage.
- **Dark/Light Mode**: Supports system theme preferences.
- **Refined Aesthetics**: Clean, modern interface using Tailwind CSS and Shadcn UI components.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Bun (recommended) or npm/yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd next-stop
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query, Context API
- **Backend**: Firebase (Auth, Firestore)
- **Maps**: MapLibre GL, React Map GL
- **Drag & Drop**: dnd-kit
- **Date Handling**: date-fns

## License

This project is licensed under the MIT License.
