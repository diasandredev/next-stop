import { useState } from 'react';
import { Card, Dashboard, Trip } from '@/types/kanban';
import { DayColumn } from './DayColumn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, X, Settings, Pencil, Calendar, Wallet, Maximize2, Minimize2, Bed, MapPin, FileUp } from 'lucide-react';
import { ImportCardsDialog } from './ImportCardsDialog';
import { useKanban } from '@/contexts/KanbanContext';
import chroma from 'chroma-js';
import { ColorPicker } from './ColorPicker';
import { LocationSearch } from './LocationSearch';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from './ui/label';
import { addDays, format } from 'date-fns';
import { DateRangePicker } from './DateRangePicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencySymbol } from '@/utils/currency';
import { cn } from '@/lib/utils';

interface DashboardViewProps {
    dashboard: Dashboard;
    trip: Trip;
    cards: Card[];
    today: string;
    searchQuery?: string;
}

export const DashboardView = ({ dashboard, trip, cards, today, searchQuery = '' }: DashboardViewProps) => {
    const { updateDashboard, deleteDashboard } = useKanban();
    const { user } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(dashboard.name);

    // Settings State
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [editDays, setEditDays] = useState(dashboard.days);
    const [editStartDate, setEditStartDate] = useState(dashboard.startDate || trip.startDate || new Date().toISOString());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isFluidOverride, setIsFluidOverride] = useState<boolean | null>(null);

    // Calculate dates
    const startDateStr = dashboard.startDate || trip.startDate || new Date().toISOString();
    const startDate = new Date(startDateStr);

    const dates = Array.from({ length: Math.max(1, dashboard.days || 1) }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return d;
    });

    const handleNameSave = () => {
        if (name.trim() && name !== dashboard.name) {
            updateDashboard(dashboard.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handleSettingsSave = () => {
        updateDashboard(dashboard.id, {
            days: editDays,
            startDate: editStartDate
        });
        setSettingsOpen(false);
    };

    // Calculate max cards in any column for this dashboard to sync grid lines
    const dayCardCounts = dates.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayCards = cards.filter(c => c.date === dateStr && c.dashboardId === dashboard.id);

        let visualCount = 0;
        dayCards.forEach(c => {
            if (c.parentId) return; // Skip children, they are counted within parent container

            if (c.type === 'options') {
                // Find children for this option
                const children = cards.filter(child => child.parentId === c.id);
                const count1 = children.filter(child => child.optionId === '1').length;
                const count2 = children.filter(child => child.optionId === '2').length;
                // Header (1 slot) + Content (max children) + AddButton (1 slot) + Margins (~0.5 but let's say 0)
                visualCount += 2 + Math.max(count1, count2);
            } else {
                visualCount += 1;
            }
        });
        return visualCount;
    });

    const maxCards = Math.max(0, ...dayCardCounts);
    // Ensure at least a minimum visual height (e.g. 5) but extend if there are more cards
    const unifiedMinSlots = Math.max(5, maxCards + 1);

    const totalColumns = dates.length;

    // Calculate total trip cost across all cards in this dashboard
    const tripTotalCost = cards.reduce((acc, card) => {
        if (card.dashboardId === dashboard.id && card.cost) {
            const currency = card.currency || 'USD';
            acc[currency] = (acc[currency] || 0) + card.cost;
        }
        return acc;
    }, {} as Record<string, number>);

    // Width logic: if <= 5 columns, fill space (fluid). If > 5, fixed width (scroll).
    const isFluid = isFluidOverride !== null ? isFluidOverride : totalColumns <= 5;
    const containerClass = isFluid ? "flex gap-6 w-full h-full" : "flex gap-6 min-w-max h-full";
    const columnClass = isFluid
        ? `flex-1 min-w-0 h-full ${totalColumns === 1 ? 'max-w-[50%]' : ''}`
        : "w-96 flex-shrink-0 h-full";

    const dashboardColor = dashboard.backgroundColor && dashboard.backgroundColor !== 'transparent' 
        ? dashboard.backgroundColor 
        : '#A1A1AA'; // Light Gray fallback for "No Color"

    const hasCustomColor = dashboard.backgroundColor && dashboard.backgroundColor !== 'transparent';

    return (
        <div className="flex flex-col gap-6 p-1">
            {/* Glassmorphic Dashboard Header */}
            <div 
                className={cn(
                    "rounded-2xl border border-border backdrop-blur-xl p-5 relative overflow-hidden group/dash",
                    hasCustomColor ? "" : "bg-card/40 dark:bg-secondary/40"
                )}
                style={hasCustomColor ? { backgroundColor: chroma(dashboard.backgroundColor!).alpha(0.15).css() } : undefined}
            >
                {/* Decorative background glow - Removed */}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    
                    {/* Title Section */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ring-1 ring-border"
                            style={{ 
                                backgroundColor: chroma(dashboardColor).alpha(0.1).css(),
                                color: dashboardColor
                            }}
                        >
                            <MapPin className="w-6 h-6" />
                        </div>
                        
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 group/title">
                                {isEditingName ? (
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onBlur={handleNameSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                        autoFocus
                                        className="bg-transparent border-none outline-none text-foreground w-full"
                                        style={{ 
                                            fontFamily: "'Space Grotesk', sans-serif",
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            letterSpacing: '-0.025em',
                                            lineHeight: 1.2
                                        }}
                                    />
                                ) : (
                                    <h2 
                                        onClick={() => setIsEditingName(true)}
                                        className="text-2xl font-display font-bold tracking-tight text-foreground truncate cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        {dashboard.name}
                                    </h2>
                                )}
                                {!isEditingName && <Pencil onClick={() => setIsEditingName(true)} className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover/title:opacity-100 transition-opacity cursor-pointer" />}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>
                                        {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d')}
                                    </span>
                                </div>

                                {dashboard.accommodation && (
                                     <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dashboard.accommodation.address)}&query_place_id=${dashboard.accommodation.placeId}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border hover:bg-muted hover:text-foreground transition-colors max-w-[200px]"
                                    >
                                        <Bed className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="truncate">{dashboard.accommodation.name}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions & Stats */}
                    <div className="flex items-center gap-3">
                         {/* Stats Pill */}
                         {Object.keys(tripTotalCost).length > 0 && (
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm mr-2">
                                <Wallet className="w-4 h-4 text-muted-foreground" />
                                <div className="flex items-center gap-3">
                                    {Object.entries(tripTotalCost).map(([curr, amount]) => (
                                        <div key={curr} className="flex items-baseline gap-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{getCurrencySymbol(curr)}</span>
                                            <span className="text-sm font-mono font-bold text-foreground">
                                                {new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 backdrop-blur-sm">
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-md"
                                            onClick={() => setIsFluidOverride(prev => {
                                                const current = prev !== null ? prev : totalColumns <= 5;
                                                return !current;
                                            })}
                                        >
                                            {isFluid ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isFluid ? "Switch to Scroll View" : "Switch to Fit View"}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <div className="w-px h-4 bg-white/10 mx-1" />

                            <ColorPicker
                                open={isColorPickerOpen}
                                onOpenChange={setIsColorPickerOpen}
                                color={dashboard.backgroundColor || 'transparent'}
                                onChange={(color) => updateDashboard(dashboard.id, { backgroundColor: color })}
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-md group/color">
                                        <div 
                                            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10 group-hover/color:scale-110 transition-transform" 
                                            style={{ backgroundColor: dashboard.backgroundColor && dashboard.backgroundColor !== 'transparent' ? dashboard.backgroundColor : 'transparent' }}
                                        />
                                    </Button>
                                }
                            />
                            
                            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-md">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent hideCloseButton className="bg-background border-none text-foreground sm:max-w-[600px] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden">
                                    <DialogTitle className="sr-only">{dashboard.name} Settings</DialogTitle>
                                    
                                    {/* Header Bar */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center ring-1 ring-border"
                                                style={{ 
                                                    backgroundColor: chroma(dashboardColor).alpha(0.15).css(),
                                                    color: dashboardColor
                                                }}
                                            >
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <span className="text-lg font-semibold text-foreground">{dashboard.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {trip.ownerId === user?.uid && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-full"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full" onClick={() => setSettingsOpen(false)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                                        {/* Properties */}
                                        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-4">
                                            {/* Duration */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Duration
                                                </Label>
                                                <div className="bg-card rounded-lg border border-border overflow-hidden">
                                                    <DateRangePicker
                                                        date={{
                                                            from: editStartDate ? new Date(editStartDate) : undefined,
                                                            to: editStartDate && editDays ? addDays(new Date(editStartDate), editDays - 1) : undefined
                                                        }}
                                                        setDate={(range) => {
                                                            if (range?.from) {
                                                                setEditStartDate(range.from.toISOString());
                                                                if (range.to) {
                                                                    const diffTime = Math.abs(range.to.getTime() - range.from.getTime());
                                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                                    setEditDays(diffDays);
                                                                } else {
                                                                    setEditDays(1);
                                                                }
                                                            } else {
                                                                setEditStartDate('');
                                                                setEditDays(1);
                                                            }
                                                        }}
                                                        fromDate={trip.startDate ? new Date(trip.startDate) : undefined}
                                                        toDate={trip.endDate ? new Date(trip.endDate) : undefined}
                                                    />
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-full h-px bg-border" />

                                            {/* Accommodation */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <Bed className="w-3.5 h-3.5" />
                                                    Accommodation
                                                </Label>
                                                <div className="bg-card rounded-lg border border-border overflow-hidden">
                                                    <LocationSearch
                                                        defaultValue={dashboard.accommodation?.name || dashboard.accommodation?.address}
                                                        onLocationSelect={(location) => {
                                                            updateDashboard(dashboard.id, { accommodation: location });
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-full h-px bg-border" />

                                            {/* Import Cards */}
                                            <div className="space-y-2">
                                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <FileUp className="w-3.5 h-3.5" />
                                                    Import Cards
                                                </Label>
                                                <div className="bg-card rounded-lg border border-border p-3">
                                                    <ImportCardsDialog
                                                        dashboardId={dashboard.id}
                                                        startDate={editStartDate}
                                                        days={editDays}
                                                        trigger={
                                                            <Button variant="outline" className="w-full justify-start gap-2 h-9">
                                                                <FileUp className="w-4 h-4" />
                                                                Import from JSON
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-end">
                                        <Button
                                            onClick={handleSettingsSave}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 px-6 text-sm font-medium"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete City?"
                description="Delete this city? Cards will be hidden/lost properly unless moved."
                onConfirm={() => {
                    deleteDashboard(dashboard.id);
                    setSettingsOpen(false); 
                }}
                confirmText="Delete"
                variant="destructive"
            />

            {/* Content: Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 pt-1 -mx-1 px-1 custom-scrollbar">
                <div className={containerClass}>
                    {/* Day Columns */}
                    {dates.map((date, index) => {
                        const dateStr = date.toISOString().split('T')[0];
                        return (
                            <div key={dateStr} className={columnClass}>
                                    <DayColumn
                                    dashboardId={dashboard.id}
                                    date={date}
                                    dayIndex={index + 1}
                                    cards={cards.filter(c => c.date === dateStr)}
                                    isCurrentDay={dateStr === today}
                                    minSlots={unifiedMinSlots}
                                    isWeekend={date.getDay() === 0 || date.getDay() === 6} 
                                    dashboardColor={dashboardColor}
                                    searchQuery={searchQuery}
                                    accommodation={dashboard.accommodation}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
