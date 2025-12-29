import { useState } from 'react';
import { Card, Dashboard, ExtraColumn as ExtraColumnType, Trip } from '@/types/kanban';
import { DayColumn } from './DayColumn';
import { ExtraColumn } from './ExtraColumn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Settings, Trash2, X } from 'lucide-react';
import { useKanban } from '@/contexts/KanbanContext';
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

interface DashboardViewProps {
    dashboard: Dashboard;
    trip: Trip;
    cards: Card[];
    extraColumns: ExtraColumnType[];
    today: string;
}

export const DashboardView = ({ dashboard, trip, cards, extraColumns, today }: DashboardViewProps) => {
    const { updateDashboard, deleteDashboard } = useKanban();
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(dashboard.name);

    // Settings State
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [editDays, setEditDays] = useState(dashboard.days);
    const [editStartDate, setEditStartDate] = useState(dashboard.startDate || trip.startDate || new Date().toISOString());

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
        return cards.filter(c => c.date === dateStr && c.columnType === 'day' && c.dashboardId === dashboard.id).length;
    });

    const extraCardCounts = extraColumns
        .filter(ec => ec.dashboardId === dashboard.id)
        .map(col => {
            return cards.filter(c => c.columnType === 'extra' && c.extraColumnId === col.id).length;
        });

    const maxCards = Math.max(0, ...dayCardCounts, ...extraCardCounts);
    // Ensure at least a minimum visual height (e.g. 5) but extend if there are more cards
    const unifiedMinSlots = Math.max(5, maxCards + 1);

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-xl bg-background/40 backdrop-blur-sm shadow-sm relative group/dash">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-4">
                    {isEditingName ? (
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                            autoFocus
                            className="text-xl font-bold h-9 w-64 bg-background"
                        />
                    ) : (
                        <h2
                            onClick={() => setIsEditingName(true)}
                            className="text-xl font-bold cursor-pointer hover:underline decoration-dashed underline-offset-4"
                        >
                            {dashboard.name}
                        </h2>
                    )}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d')}
                    </span>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover/dash:opacity-100 transition-opacity">
                    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent hideCloseButton className="bg-[#E8E1F5] border-none text-black sm:max-w-[500px] p-0 rounded-3xl shadow-2xl overflow-hidden gap-0">
                            <div className="p-6 pb-2">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        {dashboard.name}
                                        <Settings className="w-4 h-4 text-black/50" />
                                    </h2>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5" onClick={() => setSettingsOpen(false)}>
                                        <span className="sr-only">Close</span>
                                        <X className="w-4 h-4 opacity-50" />
                                    </Button>
                                </div>

                                <div className="mb-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-black/50">Travel Dates</Label>
                                        <div className="bg-white/50 p-1 pl-3 rounded-xl flex items-center gap-2 relative">
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
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="bg-[#E8E1F5] p-6 pt-2 flex items-center justify-between">
                                <Button
                                    onClick={handleSettingsSave}
                                    className="bg-[#Bfb6d3] hover:bg-[#Bfb6d3]/90 text-white rounded-full h-10 px-8 font-bold shadow-none"
                                >
                                    Save
                                </Button>

                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (confirm('Delete this dashboard? Cards will be hidden/lost properly unless moved.')) {
                                            deleteDashboard(dashboard.id);
                                        }
                                    }}
                                    className="text-[#ff5f57] hover:bg-[#ff5f57]/10 hover:text-[#ff5f57] gap-2 rounded-full"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Dashboard
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Content: Horizontal Scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-4 min-w-max h-full">
                    {/* Day Columns */}
                    {dates.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        return (
                            <div key={dateStr} className="w-80 flex-shrink-0 h-full">
                                <DayColumn
                                    dashboardId={dashboard.id}
                                    date={date}
                                    cards={cards.filter(c => c.date === dateStr && c.columnType === 'day')}
                                    isCurrentDay={dateStr === today}
                                    minSlots={unifiedMinSlots}
                                    isWeekend={date.getDay() === 0 || date.getDay() === 6} // Just styling
                                />
                            </div>
                        );
                    })}

                    {/* Extra Columns for this dashboard */}
                    {extraColumns.filter(ec => ec.dashboardId === dashboard.id).map(col => (
                        <div key={col.id} className="w-80 flex-shrink-0 h-full">
                            <ExtraColumn
                                column={col}
                                cards={cards.filter(c => c.columnType === 'extra' && c.extraColumnId === col.id)}
                                minSlots={unifiedMinSlots}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
