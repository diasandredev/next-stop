import { useState } from 'react';
import { Card, Dashboard, Trip } from '@/types/kanban';
import { DayColumn } from './DayColumn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, X, Palette, Settings, Pencil, Calendar, Wallet } from 'lucide-react';
import { useKanban } from '@/contexts/KanbanContext';
import chroma from 'chroma-js';
import { ColorPicker } from './ColorPicker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from './ui/label';
import { addDays, format, parseISO } from 'date-fns';
import { DatePicker } from './DatePicker';
import { DateRangePicker } from './DateRangePicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { getCurrencySymbol } from '@/utils/currency';

interface DashboardViewProps {
    dashboard: Dashboard;
    trip: Trip;
    cards: Card[];
    today: string;
}

export const DashboardView = ({ dashboard, trip, cards, today }: DashboardViewProps) => {
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

        // Calculate "visual slots" used
        // Standard card = 1 slot
        // Options card = header (1) + max(branches) + footer (1) + margins(~0.5) ~ roughly 2 + max
        // Since we unified styles to ~48px (1 slot) for header, etc.
        // Let's approximate: Options = 2 (Header+Footer) + Max(ChildCount)
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
        // Filter out cards not in this dashboard (already filtered in props usually, but good to be safe if passed raw)
        // Check if card belongs to visible dates? Or just all cards in dashboard?
        // Usually cards passed here are all cards. Let's filter by dashboardId if needed.
        if (card.dashboardId === dashboard.id && card.cost && !card.completed) {
            const currency = card.currency || 'USD';
            acc[currency] = (acc[currency] || 0) + card.cost;
        }
        return acc;
    }, {} as Record<string, number>);


    // Width logic: if <= 5 columns, fill space (fluid). If > 5, fixed width (scroll).
    const isFluid = totalColumns <= 5;
    const containerClass = isFluid ? "flex gap-4 w-full h-full" : "flex gap-4 min-w-max h-full";
    const columnClass = isFluid
        ? `flex-1 min-w-0 h-full ${totalColumns === 1 ? 'max-w-[50%]' : ''}`
        : "w-80 flex-shrink-0 h-full";

    return (
        <div
            className="flex flex-col gap-4 p-4 border rounded-xl backdrop-blur-sm shadow-sm relative group/dash transition-colors duration-500"
            style={{
                borderColor: dashboard.backgroundColor && dashboard.backgroundColor !== 'transparent' ? chroma(dashboard.backgroundColor).alpha(0.3).css() : 'hsl(var(--border))',
                backgroundColor: dashboard.backgroundColor && dashboard.backgroundColor !== 'transparent' ? chroma(dashboard.backgroundColor).alpha(0.15).css() : 'bg-background/40'
            }}
        >
            {/* Dashboard Header */}
            <div className="flex items-center justify-between gap-4 pb-6 pt-2 border-b border-white/10">
                {/* Left Side: Title */}
                <div className="flex items-center gap-2 group/title flex-1 min-w-0">
                    {isEditingName ? (
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            autoFocus
                            className="text-3xl md:text-3xl font-bold h-auto w-full bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground shadow-none tracking-tight"
                        />
                    ) : (
                        <div 
                            onClick={() => setIsEditingName(true)}
                            className="flex items-center gap-3 cursor-pointer select-none min-w-0"
                        >
                            <h2 className="text-3xl font-bold tracking-tight text-foreground truncate">
                                {dashboard.name}
                            </h2>
                            <Pencil className="w-4 h-4 text-muted-foreground/50 opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-200 flex-shrink-0 mt-1" />
                        </div>
                    )}
                </div>

                {/* Right Side: Metadata & Actions */}
                <div className="flex items-center gap-6 flex-shrink-0">
                     {/* Metadata: Dates & Cost */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground/80 hidden sm:flex">
                        {/* Dates */}
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-70" />
                            <span className="font-medium whitespace-nowrap">
                                {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d')}
                            </span>
                        </div>

                        {/* Cost */}
                        {Object.keys(tripTotalCost).length > 0 && (
                            <>
                                <div className="w-1 h-1 rounded-full bg-white/20" /> {/* Separator Dot */}
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-4 h-4 opacity-70" />
                                    <div className="flex items-center gap-3">
                                        {Object.entries(tripTotalCost).map(([curr, amount]) => (
                                            <div key={curr} className="flex items-baseline gap-1">
                                                <span className="text-xs font-medium opacity-70">{getCurrencySymbol(curr)}</span>
                                                <span className="font-bold font-mono">
                                                    {new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-1 transition-opacity", (settingsOpen || isColorPickerOpen) ? "opacity-100" : "opacity-0 group-hover/dash:opacity-100")}>
                        <ColorPicker
                            open={isColorPickerOpen}
                            onOpenChange={setIsColorPickerOpen}
                            color={dashboard.backgroundColor || 'transparent'}
                            onChange={(color) => updateDashboard(dashboard.id, { backgroundColor: color })}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <div 
                                        className="w-4 h-4 rounded-full border border-current/50" 
                                        style={{ backgroundColor: dashboard.backgroundColor && dashboard.backgroundColor !== 'transparent' ? dashboard.backgroundColor : 'transparent' }}
                                    />
                                </Button>
                            }
                        />
                        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                                <DialogTitle className="sr-only">Dashboard Settings</DialogTitle>

                                <div className="flex items-center justify-between mb-6">
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                        {dashboard.name}
                                        <Settings className="w-4 h-4 text-muted-foreground" />
                                    </DialogTitle>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => setSettingsOpen(false)}>
                                        <span className="sr-only">Close</span>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground">Travel Dates</Label>
                                        <div className="bg-white/5 p-1 pl-3 rounded-xl flex items-center gap-2 relative">
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
                                                disabled={(date) => {
                                                    // Optional: Stronger validation
                                                    if (trip.startDate && date < new Date(trip.startDate)) return true;
                                                    if (trip.endDate && date > new Date(trip.endDate)) return true;
                                                    return false;
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Button
                                        onClick={handleSettingsSave}
                                        className="bg-[#304D73] hover:bg-[#264059] text-white rounded-full h-10 px-6 font-medium"
                                    >
                                        Save
                                    </Button>

                                    {trip.ownerId === user?.uid && (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="text-red-400 hover:bg-red-400/10 hover:text-red-400 gap-2 rounded-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Dashboard
                                        </Button>
                                    )}
                                </div>

                                <ConfirmDialog
                                    open={showDeleteConfirm}
                                    onOpenChange={setShowDeleteConfirm}
                                    title="Delete Dashboard?"
                                    description="Delete this dashboard? Cards will be hidden/lost properly unless moved."
                                    onConfirm={() => {
                                        deleteDashboard(dashboard.id);
                                        setSettingsOpen(false); // Close settings dialog too if needed, though delete probably unmounts component
                                    }}
                                    confirmText="Delete"
                                    variant="destructive"
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Content: Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className={containerClass}>
                    {/* Day Columns */}
                    {dates.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        return (
                            <div key={dateStr} className={columnClass}>
                                    <DayColumn
                                    dashboardId={dashboard.id}
                                    date={date}
                                    cards={cards.filter(c => c.date === dateStr)}
                                    isCurrentDay={dateStr === today}
                                    minSlots={unifiedMinSlots}
                                    isWeekend={date.getDay() === 0 || date.getDay() === 6} // Just styling
                                    dashboardColor={dashboard.backgroundColor}
                                />
                            </div>
                        );
                    })}

                </div>
            </div>
        </div>
    );
}
