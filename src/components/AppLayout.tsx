import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { NewTripDialog } from '@/components/NewTripDialog';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
    const { user, logout } = useAuth();
    const {
        trips,
        dashboards,
        currentTripId,
        setCurrentTripId,
        isLoading
    } = useKanban();

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [showNewTripDialog, setShowNewTripDialog] = useState(false);
    const [showAccountSettingsDialog, setShowAccountSettingsDialog] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar
                isExpanded={isSidebarExpanded}
                toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
                trips={trips}
                dashboards={dashboards}
                currentTripId={currentTripId}
                setCurrentTripId={setCurrentTripId}
                user={user}
                logout={logout}
                onOpenAccountSettings={() => setShowAccountSettingsDialog(true)}
                onOpenNewTrip={() => setShowNewTripDialog(true)}
            />

            <div className="flex-1 h-screen overflow-hidden flex flex-col relative">
                <Outlet context={{ setIsSidebarExpanded }} />
            </div>

            <NewTripDialog
                open={showNewTripDialog}
                onOpenChange={setShowNewTripDialog}
            />

            <AccountSettingsDialog
                open={showAccountSettingsDialog}
                onOpenChange={setShowAccountSettingsDialog}
            />
        </div>
    );
}
