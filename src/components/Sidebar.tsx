import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    Plane,
    Map as MapIcon,
    LayoutDashboard,
    Wallet,
    Utensils,
    Compass
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
                "h-screen flex flex-col transition-all duration-300 ease-in-out relative z-50",
                "bg-secondary/40 backdrop-blur-xl border-r border-white/5", // Glassmorphism container
                isExpanded ? "w-72" : "w-20"
            )}
        >
            {/* Toggle Button - Floating outside */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-8 bg-zinc-900 border border-white/10 rounded-full p-1.5 hover:bg-zinc-800 hover:text-white transition-all z-30 shadow-lg text-muted-foreground"
            >
                {isExpanded ? (
                    <ChevronLeft className="w-3 h-3" />
                ) : (
                    <ChevronRight className="w-3 h-3" />
                )}
            </button>

            {/* Header / Logo */}
            <div className={cn("flex items-center py-6", isExpanded ? "justify-center" : "justify-center")}>
                <Logo 
                    showText={false} 
                    iconSize={isExpanded ? 200 : 42} 
                />
            </div>

            {/* Trips List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-4 py-2 scrollbar-none">
                
                {/* Section Header */}
                <div className={cn("px-3 flex items-center justify-between", !isExpanded && "justify-center")}>
                     {isExpanded ? (
                        <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest font-mono">
                            Trips
                        </span>
                     ) : (
                        <div className="w-4 h-0.5 bg-white/10 rounded-full" />
                     )}
                     
                     {isExpanded && (
                        <button 
                            onClick={onOpenNewTrip}
                            className="text-muted-foreground/50 hover:text-white transition-colors p-1"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                     )}
                </div>

                <div className="space-y-1">
                    {trips.length === 0 && isExpanded && (
                         <div className="px-3 py-8 text-center border border-dashed border-white/10 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-3">No trips yet.</p>
                            <button
                                onClick={onOpenNewTrip}
                                className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-md transition-colors"
                            >
                                Create Trip
                            </button>
                         </div>
                    )}

                    {trips.map((trip) => {
                        const isTripExpanded = expandedTripId === trip.id;
                        const isTripActive = currentTripId === trip.id;

                        return (
                            <div key={trip.id} className="flex flex-col gap-1">
                                {isExpanded ? (
                                     <button
                                     onClick={() => {
                                         if (isExpanded) {
                                             setExpandedTripId(isTripExpanded ? null : trip.id);
                                             if (!isTripActive) setCurrentTripId(trip.id);
                                         } else {
                                             setCurrentTripId(trip.id);
                                             navigate('/board');
                                         }
                                     }}
                                         className={cn(
                                             "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group relative select-none",
                                             isTripActive 
                                                 ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]" 
                                                 : "text-muted-foreground hover:text-white hover:bg-white/5",
                                             !isExpanded && "justify-center"
                                         )}
                                 >
                                     <Plane className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", isTripActive && "text-primary", isTripExpanded && isExpanded && "rotate-45")} />

                                     {isExpanded && (
                                         <>
                                             <span className="text-sm font-medium truncate flex-1 text-left tracking-tight">
                                                 {trip.name}
                                             </span>
                                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", !isTripExpanded && "-rotate-90")} />
                                             </div>
                                         </>
                                     )}
                                     
                                     {/* Active Indicator Dot */}
                                     {isTripActive && !isExpanded && (
                                         <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                                     )}
                                 </button>
                                ) : (
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => {
                                                if (isExpanded) {
                                                    setExpandedTripId(isTripExpanded ? null : trip.id);
                                                    if (!isTripActive) setCurrentTripId(trip.id);
                                                } else {
                                                    setCurrentTripId(trip.id);
                                                    navigate('/board');
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group relative select-none",
                                                isTripActive 
                                                    ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(56,189,248,0.2)]" 
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5",
                                                !isExpanded && "justify-center"
                                            )}
                                        >
                                            <Plane className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", isTripActive && "text-primary", isTripExpanded && isExpanded && "rotate-45")} />

                                            {isExpanded && (
                                                <>
                                                    <span className="text-sm font-medium truncate flex-1 text-left tracking-tight">
                                                        {trip.name}
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", !isTripExpanded && "-rotate-90")} />
                                                    </div>
                                                </>
                                            )}
                                            
                                            {/* Active Indicator Dot */}
                                            {isTripActive && !isExpanded && (
                                                <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    {!isExpanded && (
                                        <TooltipContent side="right" className="bg-zinc-900 border-white/10 text-white">
                                            {trip.name}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                                )}

                                {/* Sub-menu with connecting line */}
                                {isExpanded && isTripExpanded && (
                                    <div className="ml-5 pl-4 border-l border-white/5 space-y-0.5 animate-accordion-down overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setCurrentTripId(trip.id);
                                                navigate('/board');
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all duration-200",
                                                location.pathname === '/board' && isTripActive
                                                    ? "text-white font-medium bg-white/5"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Board
                                        </button>

                                        <div>
                                            <button
                                                onClick={() => setIsMapExpanded(!isMapExpanded)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-2 rounded-lg text-sm transition-all duration-200",
                                                    "text-muted-foreground hover:text-white hover:bg-white/5 cursor-pointer group/map"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MapIcon className="w-4 h-4" />
                                                    Map
                                                </div>
                                                <ChevronDown className={cn("w-3 h-3 opacity-0 group-hover/map:opacity-50 transition-all", !isMapExpanded && "-rotate-90")} />
                                            </button>
                                            
                                            {/* Dashboards List under Map */}
                                            {isMapExpanded && (
                                                <div className="ml-3 pl-3 border-l border-white/5 mt-0.5 space-y-0.5">
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
                                                                    ? "text-primary font-medium bg-primary/10"
                                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                                            )}
                                                        >
                                                            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                                            <span className="truncate">{dashboard.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expenses - Disabled State */}
                                        <div className="relative group/disabled">
                                            <button
                                                disabled
                                                className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-muted-foreground/30 cursor-not-allowed"
                                            >
                                                <Wallet className="w-4 h-4" />
                                                <span className="flex-1 text-left">Expenses</span>
                                            </button>
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-widest text-muted-foreground/40 border border-white/5 px-1 rounded bg-black/20">Soon</span>
                                        </div>
                                        
                                        {/* Restaurants - Disabled State */}
                                        <div className="relative group/disabled">
                                            <button
                                                disabled
                                                className="w-full flex items-center gap-3 p-2 rounded-lg text-sm text-muted-foreground/30 cursor-not-allowed"
                                            >
                                                <Utensils className="w-4 h-4" />
                                                <span className="flex-1 text-left">Restaurants</span>
                                            </button>
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-widest text-muted-foreground/40 border border-white/5 px-1 rounded bg-black/20">Soon</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {!isExpanded && (
                         <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button 
                                    onClick={onOpenNewTrip}
                                    className="w-full flex justify-center p-2 mt-4 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">New Trip</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* User Section (Bottom) */}
            <div className="p-4 mt-auto">
                <div className={cn(
                    "rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm overflow-hidden transition-all duration-300",
                    isExpanded ? "p-3" : "p-1.5 bg-transparent border-none"
                )}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "w-full flex items-center gap-3 transition-all duration-200 group cursor-pointer outline-none",
                                !isExpanded && "justify-center"
                            )}>
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {user?.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName || 'User'}
                                            className="w-9 h-9 rounded-full object-cover ring-2 ring-black shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-[#E85D04]/20 ring-2 ring-black">
                                            <span className="text-xs font-bold text-primary-foreground">
                                                {user?.displayName
                                                    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                                    : user?.email?.substring(0, 2).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#09090b]" />
                                </div>

                                {isExpanded && (
                                    <>
                                        <div className="flex flex-col overflow-hidden flex-1 text-left">
                                            <span className="text-sm font-medium truncate text-white group-hover:text-primary transition-colors">
                                                {user?.displayName || 'Traveler'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {user?.email}
                                            </span>
                                        </div>
                                        <Settings className="w-4 h-4 text-muted-foreground group-hover:rotate-45 transition-transform duration-300" />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side={isExpanded ? "top" : "right"}
                            align={isExpanded ? "start" : "end"}
                            sideOffset={12}
                            className="w-56 bg-[#121214] border-white/10 text-white p-2 rounded-xl shadow-2xl backdrop-blur-xl"
                        >
                            <div className="px-2 py-1.5 text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
                                Account
                            </div>
                            <DropdownMenuItem onClick={onOpenAccountSettings} className="cursor-pointer gap-2.5 py-2.5 rounded-lg hover:bg-white/10 focus:bg-white/10 focus:text-white">
                                <Settings className="w-4 h-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2.5 py-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 mt-1">
                                <LogOut className="w-4 h-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </aside>
    );
}
