import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/contexts/KanbanContext';
import { Trip } from '@/types/kanban';
import { Label } from './ui/label';
import { Plane, Trash2, X } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';
import { ConfirmDialog } from './ConfirmDialog';

interface TripSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: Trip | null;
}

export function TripSettingsDialog({ open, onOpenChange, trip }: TripSettingsDialogProps) {
    const { updateTrip, deleteTrip } = useKanban();
    const [name, setName] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (trip) {
            setName(trip.name);
            setDateRange({
                from: trip.startDate ? new Date(trip.startDate) : undefined,
                to: trip.endDate ? new Date(trip.endDate) : undefined
            });
        }
    }, [trip]);

    const handleSave = () => {
        if (trip && name.trim()) {
            updateTrip(trip.id, {
                name: name.trim(),
                startDate: dateRange?.from?.toISOString(),
                endDate: dateRange?.to?.toISOString()
            });
            onOpenChange(false);
        }
    };

    const handleConfirmDelete = () => {
        if (trip) {
            deleteTrip(trip.id);
            onOpenChange(false);
        }
    };

    if (!trip) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                <DialogTitle className="sr-only">Trip Settings</DialogTitle>
                <DialogDescription className="sr-only">Edit your trip details.</DialogDescription>

                <div className="flex items-center justify-between mb-6">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Trip settings
                        <Plane className="w-4 h-4 text-muted-foreground" />
                    </DialogTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => onOpenChange(false)}>
                        <span className="sr-only">Close</span>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4 mb-6">
                    <Label className="text-sm font-medium text-muted-foreground">Information</Label>

                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                            <div className="bg-white/5 rounded-xl">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border-none p-3 text-base font-medium focus:outline-none placeholder:text-muted-foreground/50 text-white"
                                    placeholder="Trip Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Trip Dates</Label>
                            <div className="flex items-center gap-2 bg-white/5 p-1 pl-3 rounded-xl relative">
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between">
                    <Button
                        onClick={handleSave}
                        className="bg-[#304D73] hover:bg-[#264059] text-white rounded-full h-10 px-6 font-medium"
                    >
                        Save
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-400 hover:bg-red-400/10 hover:text-red-400 gap-2 rounded-full"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Trip
                    </Button>
                </div>
            </DialogContent>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Trip?"
                description="Are you sure you want to delete this trip? All dashboards and cards will be lost."
                onConfirm={handleConfirmDelete}
                confirmText="Delete Trip"
                variant="destructive"
            />
        </Dialog>
    );
}
