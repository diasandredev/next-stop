import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Trash2, Globe, User, X } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
                <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                    <DialogTitle className="sr-only">Account Settings</DialogTitle>
                    <DialogDescription className="sr-only">Manage your account settings.</DialogDescription>

                    <div className="flex items-center justify-between mb-6">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            Account settings
                            <Settings className="w-4 h-4 text-muted-foreground" />
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => onOpenChange(false)}>
                            <span className="sr-only">Close</span>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Information Section */}
                    <div className="space-y-4 mb-6">
                        <Label className="text-sm font-medium text-muted-foreground">Information</Label>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <span className="font-medium">{user?.displayName || 'User'}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
                                    <span className="font-medium">{user?.email || 'email@example.com'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-4 mb-6">
                        <Label className="text-sm font-medium text-muted-foreground">Configuration</Label>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Timezone</Label>
                            <div className="bg-white/5 rounded-xl">
                                <Select value={timezone} onValueChange={setTimezone}>
                                    <SelectTrigger className="bg-transparent border-none h-12 text-base font-medium focus:ring-0">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <SelectValue placeholder="Select timezone" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#2a2a2a] border-white/10">
                                        {Intl.supportedValuesOf('timeZone').map((tz) => (
                                            <SelectItem key={tz} value={tz} className="text-white focus:bg-white/10 focus:text-white">
                                                {tz.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                            onClick={() => setShowDeleteAlert(true)}
                            className="text-red-400 hover:bg-red-400/10 hover:text-red-400 gap-2 rounded-full"
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
