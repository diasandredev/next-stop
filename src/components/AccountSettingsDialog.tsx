import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Trash2, Globe, User } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from './ConfirmDialog';

interface AccountSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
    const { accountSettings, updateAccountSettings, deleteAllCards } = useKanban();
    const { user } = useAuth();
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    useEffect(() => {
        if (open && accountSettings?.timezone) {
            setTimezone(accountSettings.timezone);
        }
    }, [open, accountSettings]);

    const handleSave = () => {
        updateAccountSettings({ timezone });
        onOpenChange(false);
    };

    const handleDeleteCards = () => {
        // Delete all cards
        deleteAllCards();

        setShowDeleteAlert(false);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent hideCloseButton className="bg-[#E8E1F5] border-none text-black sm:max-w-[500px] p-0 rounded-3xl shadow-2xl overflow-hidden gap-0">
                    <DialogTitle className="sr-only">Account Settings</DialogTitle>
                    <div className="p-6 pb-2">
                        <div className="flex items-center justify-between mb-6">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                Account settings
                                <Settings className="w-4 h-4 text-black/50" />
                            </DialogTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>

                        {/* Information Section */}
                        <div className="mb-6 space-y-4">
                            <h3 className="font-bold text-sm text-black/60 uppercase tracking-wider">Information</h3>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-black/50">Name</Label>
                                <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
                                    <User className="w-5 h-5 text-black/40" />
                                    <span className="font-medium">{user?.displayName || 'User'}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-black/50">Email</Label>
                                <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
                                    <span className="font-medium">{user?.email || 'email@example.com'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Settings Section */}
                        <div className="mb-6 space-y-4">
                            <h3 className="font-bold text-sm text-black/60 uppercase tracking-wider">Configuration</h3>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-black/50">Timezone</Label>
                                <div className="bg-white/50 rounded-xl">
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger className="bg-transparent border-none h-12 text-base font-medium focus:ring-0">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-black/50" />
                                                <SelectValue placeholder="Select timezone" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Intl.supportedValuesOf('timeZone').map((tz) => (
                                                <SelectItem key={tz} value={tz}>
                                                    {tz.replace(/_/g, ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-[#E8E1F5] p-6 pt-2 flex items-center justify-between">
                        <Button
                            onClick={handleSave}
                            className="bg-[#Bfb6d3] hover:bg-[#Bfb6d3]/90 text-white rounded-full h-10 px-8 font-bold"
                        >
                            Save
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowDeleteAlert(true)}
                            className="text-[#ff5f57] hover:bg-[#ff5f57]/10 hover:text-[#ff5f57] gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete cards
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showDeleteAlert}
                onOpenChange={setShowDeleteAlert}
                title="Delete all cards?"
                description="This action cannot be undone. This will permanently delete ALL cards in the current view."
                onConfirm={handleDeleteCards}
                confirmText="Delete"
                variant="destructive"
            />
        </>
    );
}
