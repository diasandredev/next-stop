import { useState, useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { NewTripDialog } from '@/components/NewTripDialog';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import { BottomTabs } from '@/components/BottomTabs';
import { TripSelector } from '@/components/TripSelector';
import { DashboardSelector } from '@/components/DashboardSelector';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SidebarContext {
    setIsSidebarExpanded: (expanded: boolean) => void;
}

interface AppLayoutProps {
    onOpenDashboardSelector?: (open: boolean) => void;
}

export function AppLayout({ onOpenDashboardSelector }: AppLayoutProps) {
    const { user, logout } = useAuth();
    const {
        trips,
        dashboards,
        currentTripId,
        setCurrentTripId,
        isLoading
    } = useKanban();

    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNewTripDialog, setShowNewTripDialog] = useState(false);
    const [showAccountSettingsDialog, setShowAccountSettingsDialog] = useState(false);
    const [showTripSelector, setShowTripSelector] = useState(false);
    const [showDashboardSelector, setShowDashboardSelector] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
            {/* Mobile Menu Button - Only visible on mobile */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-[max(env(safe-area-inset-top,1rem),1rem)] left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border border-border"
                onClick={toggleMobileMenu}
            >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300",
                    isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={closeMobileMenu}
            />

            {/* Sidebar - Desktop always visible, Mobile as drawer */}
            <div className={cn(
                "fixed md:relative z-50 transition-transform duration-300 md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <Sidebar
                    isExpanded={isSidebarExpanded}
                    toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
                    trips={trips}
                    dashboards={dashboards}
                    currentTripId={currentTripId}
                    setCurrentTripId={(id) => {
                        setCurrentTripId(id);
                        closeMobileMenu();
                    }}
                    user={user}
                    logout={logout}
                    onOpenAccountSettings={() => {
                        setShowAccountSettingsDialog(true);
                        closeMobileMenu();
                    }}
                    onOpenNewTrip={() => {
                        setShowNewTripDialog(true);
                        closeMobileMenu();
                    }}
                    onClose={closeMobileMenu}
                />
            </div>

            <div className="flex-1 h-screen overflow-hidden flex flex-col relative">
                <Outlet context={{ setIsSidebarExpanded, setShowTripSelector: setShowTripSelector, setShowDashboardSelector: setShowDashboardSelector }} />
            </div>

            {/* Bottom Tabs - Only visible on mobile */}
            <BottomTabs
                currentTripId={currentTripId}
                onOpenTripSelector={() => setShowTripSelector(true)}
                onOpenDashboardSelector={() => setShowDashboardSelector(true)}
            />

            <NewTripDialog
                open={showNewTripDialog}
                onOpenChange={setShowNewTripDialog}
            />

            <AccountSettingsDialog
                open={showAccountSettingsDialog}
                onOpenChange={setShowAccountSettingsDialog}
            />

            <TripSelector
                open={showTripSelector}
                onOpenChange={setShowTripSelector}
                onOpenNewTrip={() => setShowNewTripDialog(true)}
            />

            <DashboardSelector
                open={showDashboardSelector}
                onOpenChange={setShowDashboardSelector}
            />
        </div>
    );
}

export function useSetSidebarExpanded() {
    return useOutletContext<SidebarContext>();
}
