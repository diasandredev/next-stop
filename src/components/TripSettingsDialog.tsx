import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/contexts/KanbanContext';
import { Trip } from '@/types/kanban';
import { Label } from './ui/label';
import { Plane, Trash2, Calendar } from 'lucide-react';
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
            <DialogContent hideCloseButton className="bg-[#E8E1F5] border-none text-black sm:max-w-[500px] p-0 rounded-3xl shadow-2xl overflow-hidden gap-0">
                <DialogTitle className="sr-only">Trip Settings</DialogTitle>
                <DialogDescription className="sr-only">Edit your trip details.</DialogDescription>
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            Trip settings
                            <Plane className="w-4 h-4 text-black/50" />
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5" onClick={() => onOpenChange(false)}>
                            <span className="sr-only">Close</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4 opacity-50"
                            >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </Button>
                    </div>

                    <div className="mb-6 space-y-4">
                        <h3 className="font-bold text-sm text-black/60 uppercase tracking-wider">Information</h3>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-black/50">Name</Label>
                            <div className="bg-white/50 p-1 rounded-xl">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border-none p-2 px-3 text-base font-medium focus:outline-none placeholder:text-black/30"
                                    placeholder="Trip Name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-black/50">Trip Dates</Label>
                            <div className="flex items-center gap-2 bg-white/50 p-1 pl-3 rounded-xl relative">
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-[#E8E1F5] p-6 pt-2 flex items-center justify-between">
                    <Button
                        onClick={handleSave}
                        className="bg-[#Bfb6d3] hover:bg-[#Bfb6d3]/90 text-white rounded-full h-10 px-8 font-bold shadow-none"
                    >
                        Save
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-[#ff5f57] hover:bg-[#ff5f57]/10 hover:text-[#ff5f57] gap-2 rounded-full"
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
