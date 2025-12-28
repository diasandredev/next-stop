# Daily Board Flow

Daily Board Flow is a powerful and intuitive Kanban board application designed to help you organize your weekly tasks efficiently. With features like drag-and-drop task management, recurring tasks, and calendar integration, staying on top of your schedule has never been easier.

## Features

### 📋 Kanban Board
- **Drag & Drop**: Easily move tasks between columns (To Do, In Progress, Done, etc.).
- **Customizable Columns**: Create and manage columns to fit your workflow.
- **Task Details**: Add descriptions, subtasks, and tags to your cards.

### 📅 Calendar View
- **Weekly & Monthly Views**: Visualize your tasks on a calendar to plan ahead.
- **Sync with Kanban**: Changes in the calendar are automatically reflected in the Kanban board and vice versa.

### 🔄 Recurring Tasks
- **Automated Creation**: Set up tasks to repeat daily, weekly, or monthly.
- **Flexible Rules**: Customize recurrence patterns to suit your needs.

### ☁️ Cloud Sync
- **Real-time Sync**: Your data is synced across devices using Firebase.
- **Offline Support**: Continue working even when you're offline; changes will sync when you reconnect.

### 🎨 Modern UI
- **Responsive Design**: Works seamlessly on desktop and mobile devices.
- **Dark Mode**: Easy on the eyes for late-night planning sessions.
- **Customizable Themes**: Choose from a variety of themes to personalize your experience.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd daily-board-flow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:8080`.

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query, Context API
- **Backend/Sync**: Firebase
- **Drag & Drop**: dnd-kit
- **Date Handling**: date-fns

## License

This project is licensed under the MIT License.
