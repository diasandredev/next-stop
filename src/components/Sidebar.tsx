import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Calendar as CalendarIcon,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    MoreVertical,
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
import { Trip } from '@/types/kanban';
import { User as UserType } from 'firebase/auth';

interface SidebarProps {
    isExpanded: boolean;
    toggleSidebar: () => void;
    trips: Trip[];
    currentTripId: string | null;
    setCurrentTripId: (id: string) => void;
    user: UserType | null;
    logout: () => void;
    onOpenAccountSettings: () => void;
    onOpenTripSettings: () => void;
    setTripToEdit: (trip: Trip) => void;
    onOpenNewTrip: () => void;
    onOpenShareTrip: () => void;
}

export function Sidebar({
    isExpanded,
    toggleSidebar,
    trips,
    currentTripId,
    setCurrentTripId,
    user,
    logout,
    onOpenAccountSettings,
    onOpenTripSettings,
    setTripToEdit,
    onOpenNewTrip,
    onOpenShareTrip
}: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

    useEffect(() => {
        if (currentTripId) {
            setExpandedTripId(currentTripId);
        }
    }, [currentTripId]);

    return (
        <aside
            className={cn(
                "h-screen bg-background border-r border-border flex flex-col transition-all duration-300 ease-in-out relative z-20",
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
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">N</span>
                    </div>
                    {isExpanded && (
                        <span className="font-bold text-xl tracking-tight text-foreground whitespace-nowrap animate-in fade-in duration-300">
                            Next Stop
                        </span>
                    )}
                </div>
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
                                                    {/* Share Button */}
                                                    <div
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/80 rounded"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTripToEdit(trip);
                                                            onOpenShareTrip();
                                                        }}
                                                    >
                                                        <Users className="w-3 h-3" />
                                                    </div>
                                                    {/* Edit Button */}
                                                    <div
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/80 rounded"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTripToEdit(trip);
                                                            onOpenTripSettings();
                                                        }}
                                                    >
                                                        <Settings className="w-3 h-3" />
                                                    </div>

                                                    {/* Chevron */}
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

                                    <button
                                        onClick={() => {
                                            setCurrentTripId(trip.id);
                                            navigate('/map');
                                        }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                                            location.pathname === '/map' && isTripActive
                                                ? "bg-[#304D73]/20 text-[#5a8fc4] font-medium"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <MapIcon className="w-4 h-4" />
                                        Map
                                    </button>

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
                "p-4 border-t border-border bg-background/50",
                isExpanded ? "flex flex-col gap-1" : "flex flex-col items-center"
            )}>
                {isExpanded ? (
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border flex-shrink-0">
                                <span className="text-sm font-medium">
                                    {user?.displayName
                                        ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                        : user?.email?.substring(0, 2).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate text-foreground">
                                    {user?.displayName || 'User'}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </span>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={onOpenAccountSettings} className="cursor-pointer gap-2">
                                    <Settings className="w-4 h-4" />
                                    Account Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 text-red-500 focus:text-red-500">
                                    <LogOut className="w-4 h-4" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border hover:ring-2 hover:ring-primary/20 transition-all">
                                <span className="text-sm font-medium">
                                    {user?.displayName
                                        ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                        : user?.email?.substring(0, 2).toUpperCase() || 'U'}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" className="w-56 ml-2">
                            <div className="px-2 py-1.5 text-sm font-medium border-b border-border mb-1">
                                {user?.displayName || 'User'}
                            </div>
                            <DropdownMenuItem onClick={onOpenAccountSettings} className="cursor-pointer gap-2">
                                <Settings className="w-4 h-4" />
                                Account Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 text-red-500 focus:text-red-500">
                                <LogOut className="w-4 h-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </aside>
    );
}
