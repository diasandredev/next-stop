import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Trash2, Globe, User, X, MoreHorizontal, Mail, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from "next-themes";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const { theme, setTheme } = useTheme();

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
                <DialogContent 
                    hideCloseButton 
                    className="bg-background border-none text-foreground sm:max-w-[600px] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogTitle className="sr-only">Account Settings</DialogTitle>
                    <DialogDescription className="sr-only">Manage your account settings.</DialogDescription>

                    <TooltipProvider>
                        {/* Header / Actions Bar */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Settings className="w-4 h-4" />
                                <span>Account Settings</span>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Delete Cards */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full h-8 w-8" 
                                            onClick={() => setShowDeleteAlert(true)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Delete all cards</p></TooltipContent>
                                </Tooltip>

                                {/* More Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full h-8 w-8">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                                        <DropdownMenuItem 
                                            onClick={() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)} 
                                            className="focus:bg-muted focus:text-foreground cursor-pointer"
                                        >
                                            Reset to system timezone
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Close */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full" onClick={() => onOpenChange(false)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Close</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                            {/* User Info Card */}
                            <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-4">
                                <Label className="text-xs font-medium text-muted-foreground">Account Information</Label>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 h-12">
                                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="w-px h-5 bg-border" />
                                        <span className="text-sm font-medium text-foreground">{user?.displayName || 'User'}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 h-12">
                                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="w-px h-5 bg-border" />
                                        <span className="text-sm font-medium text-foreground">{user?.email || 'email@example.com'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border" />

                            {/* Appearance */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground ml-1">Appearance</Label>
                                <div className="flex items-center bg-card rounded-lg border border-border px-3 h-12 gap-2">
                                    {theme === 'dark' ? (
                                        <Moon className="w-4 h-4 text-muted-foreground shrink-0" />
                                    ) : theme === 'light' ? (
                                        <Sun className="w-4 h-4 text-muted-foreground shrink-0" />
                                    ) : (
                                        <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
                                    )}
                                    <div className="w-px h-5 bg-border" />
                                    <Select value={theme} onValueChange={setTheme}>
                                        <SelectTrigger className="bg-transparent border-none h-10 text-sm font-medium focus:ring-0 focus:ring-offset-0 shadow-none flex-1 outline-none">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border max-h-[300px]">
                                            <SelectItem value="system" className="text-foreground focus:bg-muted focus:text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="w-4 h-4" />
                                                    <span>System</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="light" className="text-foreground focus:bg-muted focus:text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Sun className="w-4 h-4" />
                                                    <span>Light</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="dark" className="text-foreground focus:bg-muted focus:text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Moon className="w-4 h-4" />
                                                    <span>Dark</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Configuration */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground ml-1">Timezone</Label>
                                <div className="flex items-center bg-card rounded-lg border border-border px-3 h-12 gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="w-px h-5 bg-border" />
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger className="bg-transparent border-none h-10 text-sm font-medium focus:ring-0 focus:ring-offset-0 shadow-none flex-1 outline-none">
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border max-h-[300px]">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {(Intl as any).supportedValuesOf('timeZone').map((tz: string) => (
                                                <SelectItem key={tz} value={tz} className="text-foreground focus:bg-muted focus:text-foreground">
                                                    {tz.replace(/_/g, ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border" />

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="rounded-full hover:bg-muted"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-10 px-6 font-medium"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </TooltipProvider>
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
