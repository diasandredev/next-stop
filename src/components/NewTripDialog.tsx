import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/contexts/KanbanContext';
import { Plane, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                <DialogTitle className="sr-only">Create New Trip</DialogTitle>
                <DialogDescription className="sr-only">Create a new trip with name and dates.</DialogDescription>
                <form onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            New Trip
                            <Plane className="w-4 h-4 text-muted-foreground" />
                        </DialogTitle>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => onOpenChange(false)}>
                            <span className="sr-only">Close</span>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <Label className="text-sm font-medium text-muted-foreground">Details</Label>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                                <div className="bg-white/5 rounded-xl">
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent border-none p-3 text-base font-medium focus:outline-none placeholder:text-muted-foreground/50 text-white"
                                        placeholder="e.g. Summer Vacation"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Trip Dates</Label>
                                <div className="flex items-center gap-2 bg-white/5 p-1 pl-3 rounded-xl relative">
                                    <DateRangePicker date={dateRange} setDate={setDateRange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            className="bg-[#304D73] hover:bg-[#264059] text-white rounded-full h-10 px-6 font-medium"
                        >
                            Create Trip
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
