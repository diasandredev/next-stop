import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/contexts/KanbanContext';
import { CalendarIcon, Plane, X } from 'lucide-react';
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
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

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
            <DialogContent hideCloseButton className="bg-[#E8E1F5] border-none text-black sm:max-w-[500px] p-0 rounded-3xl shadow-2xl overflow-hidden gap-0">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 pb-2">
                        <div className="flex items-center justify-between mb-6">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                New Trip
                                <Plane className="w-4 h-4 text-black/50" />
                            </DialogTitle>
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5" onClick={() => onOpenChange(false)}>
                                <span className="sr-only">Close</span>
                                <X className="w-4 h-4 opacity-50" />
                            </Button>
                        </div>

                        <div className="mb-6 space-y-4">
                            <h3 className="font-bold text-sm text-black/60 uppercase tracking-wider">Details</h3>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-black/50">Name</Label>
                                <div className="bg-white/50 p-1 rounded-xl">
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-transparent border-none p-2 px-3 text-base font-medium focus:outline-none placeholder:text-black/30"
                                        placeholder="e.g. Summer Vacation"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-black/50">Trip Dates</Label>
                                <div className="flex items-center gap-2 bg-white/50 p-1 pl-3 rounded-xl relative">
                                    <DateRangePicker date={dateRange} setDate={setDateRange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-[#E8E1F5] p-6 pt-2 flex items-center justify-end">
                        <Button
                            type="submit"
                            disabled={!name.trim()}
                            className="bg-[#Bfb6d3] hover:bg-[#Bfb6d3]/90 text-white rounded-full h-10 px-8 font-bold shadow-none"
                        >
                            Create Trip
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
