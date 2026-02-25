import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Trip } from '@/types/kanban';
import { Label } from './ui/label';
import { Trash2, X, MoreHorizontal, Calendar, Settings } from 'lucide-react';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';
import { ConfirmDialog } from './ConfirmDialog';
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

interface TripSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: Trip | null;
}

export function TripSettingsDialog({ open, onOpenChange, trip }: TripSettingsDialogProps) {
    const { updateTrip, deleteTrip } = useKanban();
    const { user } = useAuth();
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

    const handleDiscard = () => {
        if (trip) {
            setName(trip.name);
            setDateRange({
                from: trip.startDate ? new Date(trip.startDate) : undefined,
                to: trip.endDate ? new Date(trip.endDate) : undefined
            });
        }
    };

    if (!trip) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="bg-background border-none text-foreground md:max-w-[600px] p-0 gap-0 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto">
                <DialogTitle className="sr-only">Trip Settings</DialogTitle>
                <DialogDescription className="sr-only">Edit your trip details.</DialogDescription>

                {/* Header / Actions Bar */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg font-semibold text-foreground">{trip.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Delete */}
                        {user?.uid === trip.ownerId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full h-8 w-8"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}

                        {/* More Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-8 w-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                                <DropdownMenuItem onClick={handleDiscard} className="text-red-400 focus:text-red-400 focus:bg-accent cursor-pointer">
                                    Discard changes
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Close */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full" onClick={() => onOpenChange(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto md:max-h-[85vh]">
                    {/* Properties Grid */}
                    <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                Dates
                            </Label>
                            <div className="bg-card rounded-lg border border-border overflow-hidden">
                                <DateRangePicker
                                    date={dateRange}
                                    setDate={setDateRange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 md:px-6 py-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 px-6 text-sm font-medium"
                    >
                        Save Changes
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
