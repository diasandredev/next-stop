import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/contexts/KanbanContext';
import { X, MoreHorizontal, Calendar, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NewTripDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewTripDialog({ open, onOpenChange }: NewTripDialogProps) {
    const { addTrip, addDashboard, setCurrentTripId } = useKanban();
    const [name, setName] = useState('');
    
    // Smart Defaults: Next Friday to Sunday
    const getSmartDates = () => {
        const today = new Date();
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + (5 + 7 - today.getDay()) % 7);
        const nextSunday = new Date(nextFriday);
        nextSunday.setDate(nextFriday.getDate() + 2);
        return { from: nextFriday, to: nextSunday };
    };

    const [dateRange, setDateRange] = useState<DateRange | undefined>(getSmartDates());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            const startDate = dateRange?.from?.toISOString();
            const endDate = dateRange?.to?.toISOString();
            const tripId = addTrip(name.trim(), startDate, endDate);

            // Switch to new trip immediately
            setCurrentTripId(tripId);

            // Create default dashboard with start date (picked or today) and 1 day
            const defaultDate = startDate || new Date().toISOString();
            addDashboard(tripId, 'Main Board', defaultDate, 1);

            setName('');
            setDateRange(undefined);
            onOpenChange(false);
        }
    };

    const handleClear = () => {
        setName('');
        setDateRange(getSmartDates());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[600px] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden">
                <DialogTitle className="sr-only">Create New Trip</DialogTitle>
                <DialogDescription className="sr-only">Create a new trip with name and dates.</DialogDescription>
                
                <TooltipProvider>
                    {/* Header / Actions Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Plus className="w-4 h-4" />
                            <span>New Trip</span>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* More Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-white/10 text-white">
                                    <DropdownMenuItem onClick={handleClear} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                        Clear form
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Close */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => onOpenChange(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Close</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                        {/* Hero Section: Trip Name */}
                        <div className="space-y-4">
                            <input
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 h-auto w-full text-3xl leading-tight text-white"
                                placeholder="Trip name"
                            />
                        </div>

                        {/* Properties Grid */}
                        <div className="grid grid-cols-1 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground ml-1">Dates</Label>
                                <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10 px-3 h-12 gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="w-px h-5 bg-white/10" />
                                    <DateRangePicker 
                                        date={dateRange} 
                                        setDate={setDateRange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-white/5" />

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="rounded-full hover:bg-white/5"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!name.trim()}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 px-6 font-medium"
                            >
                                Create Trip
                            </Button>
                        </div>
                    </form>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    );
}
