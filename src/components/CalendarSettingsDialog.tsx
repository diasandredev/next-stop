import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKanban } from '@/contexts/KanbanContext';
import { Calendar } from '@/types/kanban';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Settings, Check } from 'lucide-react';



import { Switch } from "@/components/ui/switch";

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    calendar: Calendar | null;
}

export function CalendarSettingsDialog({ open, onOpenChange, calendar }: CalendarSettingsDialogProps) {
    const { updateCalendar, deleteCalendar, calendars } = useKanban();
    const [name, setName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);


    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    // Mock states for new features
    const [automateMove, setAutomateMove] = useState(true);

    useEffect(() => {
        if (calendar) {
            setName(calendar.name);
        }
    }, [calendar]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);



    const handleSubmit = () => {
        if (calendar && name.trim()) {
            updateCalendar(calendar.id, {
                name: name.trim()
            });
            onOpenChange(false);
        }
    };

    const handleDelete = () => {
        if (calendar) {
            deleteCalendar(calendar.id);
            setShowDeleteAlert(false);
            onOpenChange(false);
        }
    };

    if (!calendar) return null;

    const isLastCalendar = calendars.length <= 1;
    const hasChanges = name.trim() !== calendar.name;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent hideCloseButton className="bg-[#E8E1F5] border-none text-black sm:max-w-[500px] p-0 rounded-3xl shadow-2xl overflow-hidden gap-0">
                    <div className="p-6 pb-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Calendar settings
                                <Settings className="w-4 h-4 text-black/50" />
                            </h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>

                        {/* Calendar Name (Inline Edit) */}
                        <div className="mb-6">
                            <h3 className="font-bold text-lg mb-2 h-8 flex items-center">
                                {isEditingName ? (
                                    <Input
                                        ref={nameInputRef}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onBlur={() => setIsEditingName(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') setIsEditingName(false);
                                        }}
                                        className="bg-transparent border-none px-0 text-lg font-bold h-auto p-0 focus-visible:ring-0"
                                    />
                                ) : (
                                    <span
                                        onClick={() => setIsEditingName(true)}
                                        className="cursor-pointer hover:bg-black/5 px-1 -ml-1 rounded"
                                    >
                                        {name}
                                    </span>
                                )}
                            </h3>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="bg-[#E8E1F5] p-6 pt-2 space-y-6">
                        <div>
                            <h3 className="font-bold text-sm mb-4">Features</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center">
                                            <span className="text-lg">✨</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Automate</p>
                                            <p className="text-xs text-black/60">Move uncompleted tasks to Today</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={automateMove}
                                        onCheckedChange={setAutomateMove}
                                        className="data-[state=checked]:bg-black"
                                        thumbContent={automateMove ? <Check className="w-3 h-3 text-black" /> : null}
                                    />
                                </div>

                            </div>
                        </div>

                        {/* Save / Delete Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                onClick={handleSubmit}
                                disabled={!name.trim() || !hasChanges}
                                className="bg-[#Bfb6d3] hover:bg-[#Bfb6d3]/90 text-white rounded-full h-10 px-8 font-bold"
                            >
                                Save
                            </Button>

                            {!isLastCalendar && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowDeleteAlert(true)}
                                    className="text-[#ff5f57] hover:bg-[#ff5f57]/10 hover:text-[#ff5f57] gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete account
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent className="bg-[#E8E1F5] border-none text-black">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{calendar.name}"?</AlertDialogTitle>
                        <AlertDialogDescription className="text-black/60">
                            This action cannot be undone. This will permanently delete this calendar and all associated cards and recurring tasks.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-black/10 text-black hover:bg-black/5">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-[#ff5f57] hover:bg-[#ff5f57]/90 text-white border-none">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
