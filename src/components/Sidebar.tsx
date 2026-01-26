import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    Calendar as CalendarIcon,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    Plane,
    Map as MapIcon,
    LayoutDashboard,
    Utensils,
    Users,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trip, Dashboard } from '@/types/kanban';
import { User as UserType } from 'firebase/auth';

import { Logo } from '@/components/Logo';

interface SidebarProps {
    isExpanded: boolean;
    toggleSidebar: () => void;
    trips: Trip[];
    dashboards?: Dashboard[];
    currentTripId: string | null;
    setCurrentTripId: (id: string) => void;
    user: UserType | null;
    logout: () => void;
    onOpenAccountSettings: () => void;
    onOpenNewTrip: () => void;
}

export function Sidebar({
    isExpanded,
    toggleSidebar,
    trips,
    dashboards = [],
    currentTripId,
    setCurrentTripId,
    user,
    logout,
    onOpenAccountSettings,
    onOpenNewTrip,
}: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState(true);

    // Get dashboardId from URL query params
    const searchParams = new URLSearchParams(location.search);
    const currentDashboardId = searchParams.get('dashboardId');

    useEffect(() => {
        if (currentTripId) {
            setExpandedTripId(currentTripId);
        }
    }, [currentTripId]);

    const handleDashboardClick = (dashboardId: string) => {
        navigate(`/map?dashboardId=${dashboardId}`);
    };

    return (
        <aside
            className={cn(
                "h-screen bg-[#060606] border-r border-border flex flex-col transition-all duration-300 ease-in-out relative z-20",
                isExpanded ? "w-64" : "w-16"
            )}
        >
            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-6 bg-background border border-border rounded-full p-1 hover:bg-muted transition-colors z-30"
            >
                {isExpanded ? (
                    <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
            </button>

            {/* Header / Logo */}
            <div className={cn("flex items-center p-4 h-16", isExpanded ? "justify-start" : "justify-center")}>
                <Logo showText={isExpanded} iconSize={isExpanded ? 24 : 20} />
            </div>

            {/* Trips List */}
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-2 scrollbar-none">
                <div className={cn("px-2 mb-2", !isExpanded && "text-center")}>
                    {isExpanded ? (
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            My Trips
                        </h3>
                    ) : (
                        <div className="w-full h-px bg-border my-2" />
                    )}
                </div>

                {trips.map((trip) => {
                    const isTripExpanded = expandedTripId === trip.id;
                    const isTripActive = currentTripId === trip.id;

                    return (
                        <div key={trip.id} className="flex flex-col gap-1">
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => {
                                            if (isExpanded) {
                                                setExpandedTripId(isTripExpanded ? null : trip.id);
                                            } else {
                                                setCurrentTripId(trip.id);
                                                navigate('/board');
                                            }
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group relative",
                                            isTripActive && !isTripExpanded
                                                ? "bg-[#304D73]/20 text-[#5a8fc4]"
                                                : "hover:bg-muted text-muted-foreground hover:text-foreground",
                                            !isExpanded && "justify-center"
                                        )}
                                    >
                                        <Plane className={cn("w-5 h-5 flex-shrink-0 transition-transform", isTripExpanded && "rotate-45")} />

                                        {isExpanded && (
                                            <>
                                            <span className="text-sm font-medium truncate flex-1 text-left">
                                                    {trip.name}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    {isTripExpanded ? (
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {isTripActive && !isExpanded && (
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                {!isExpanded && (
                                    <TooltipContent side="right">
                                        {trip.name}
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            {/* Sub-menu */}
                            {isExpanded && isTripExpanded && (
                                <div className="ml-4 pl-4 border-l border-border space-y-1 animate-in slide-in-from-top-2 duration-200">
                                    <button
                                        onClick={() => {
                                            setCurrentTripId(trip.id);
                                            navigate('/board');
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                                            location.pathname === '/board' && isTripActive
                                                ? "bg-[#304D73]/20 text-[#5a8fc4] font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Board
                                    </button>

                                    <div>
                                        <button
                                            onClick={() => setIsMapExpanded(!isMapExpanded)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors",
                                                "text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <MapIcon className="w-4 h-4" />
                                                Map
                                            </div>
                                            {isMapExpanded ? (
                                                <ChevronDown className="w-3 h-3 opacity-50" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3 opacity-50" />
                                            )}
                                        </button>
                                        
                                        {/* Dashboards List under Map */}
                                        {isMapExpanded && (
                                            <div className="ml-4 pl-4 border-l border-border/50 mt-1 space-y-0.5">
                                                {dashboards
                                                    .filter(d => d.tripId === trip.id)
                                                    .sort((a, b) => {
                                                        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                                        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                                        return timeA - timeB;
                                                    })
                                                    .map(dashboard => (
                                                    <button
                                                        key={dashboard.id}
                                                        onClick={() => {
                                                            setCurrentTripId(trip.id);
                                                            handleDashboardClick(dashboard.id);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-2 p-1.5 rounded-md text-xs transition-colors",
                                                            location.pathname === '/map' && currentDashboardId === dashboard.id
                                                                ? "text-[#5a8fc4] font-medium bg-[#304D73]/10"
                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                                                        <span className="truncate">{dashboard.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        disabled
                                        className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed"
                                    >
                                        <Utensils className="w-4 h-4" />
                                        <span className="flex-1 text-left">Restaurants</span>
                                        <span className="text-[10px] uppercase border border-border px-1 rounded">Soon</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* New Trip Button */}
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onOpenNewTrip}
                            className={cn(
                                "w-full flex items-center gap-3 p-2 rounded-lg group transition-all duration-200 mt-2",
                                "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border border-dashed",
                                !isExpanded && "justify-center"
                            )}
                        >
                            <Plus className="w-5 h-5 flex-shrink-0" />
                            {isExpanded && <span className="text-sm font-medium">New Trip</span>}
                        </button>
                    </TooltipTrigger>
                    {!isExpanded && (
                        <TooltipContent side="right">New Trip</TooltipContent>
                    )}
                </Tooltip>
            </div>

            {/* User Section (Bottom) */}
            <div className={cn(
                "p-3",
                isExpanded ? "flex flex-col" : "flex flex-col items-center"
            )}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {isExpanded ? (
                            <button className="w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-muted/80 group cursor-pointer">
                                {/* Premium Avatar with gradient and status indicator */}
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                        <span className="text-sm font-semibold text-primary-foreground">
                                            {user?.displayName
                                                ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                                : user?.email?.substring(0, 2).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    {/* Online status indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
                                </div>

                                {/* User info */}
                                <div className="flex flex-col overflow-hidden flex-1 text-left">
                                    <span className="text-sm font-medium truncate text-foreground group-hover:text-foreground transition-colors">
                                        {user?.displayName || 'User'}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </span>
                                </div>

                                {/* Chevron indicator */}
                                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ) : (
                            <button className="relative group cursor-pointer">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-200 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105">
                                    <span className="text-sm font-semibold text-primary-foreground">
                                        {user?.displayName
                                            ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                            : user?.email?.substring(0, 2).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                {/* Online status indicator */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
                            </button>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side={isExpanded ? "top" : "right"}
                        align={isExpanded ? "start" : "center"}
                        sideOffset={4}
                        className="w-[calc(100%-1.5rem)] min-w-[200px]"
                    >
                        <DropdownMenuItem onClick={onOpenAccountSettings} className="cursor-pointer gap-3 py-2.5">
                            <Settings className="w-4 h-4" />
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={logout} className="cursor-pointer gap-3 py-2.5 text-red-500 focus:text-red-500 focus:bg-red-500/10">
                            <LogOut className="w-4 h-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
