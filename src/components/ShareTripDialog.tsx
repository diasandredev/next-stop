import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trip, TripShare } from '@/types/kanban';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, UserPlus, Eye, Edit3, X, Users, MoreHorizontal, Mail } from 'lucide-react';
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
import { toast } from 'sonner';

interface ShareTripDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: Trip;
    onUpdateTrip: (tripId: string, updates: Partial<Trip>) => void;
}

export const ShareTripDialog = ({ open, onOpenChange, trip, onUpdateTrip }: ShareTripDialogProps) => {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view' | 'edit'>('view');
    const [isLoading, setIsLoading] = useState(false);

    const shares = trip.sharedWith || [];

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleAddShare = async () => {
        if (!email.trim()) {
            toast.error('Please enter an email');
            return;
        }

        if (!validateEmail(email.trim())) {
            toast.error('Invalid email');
            return;
        }

        if (email.trim().toLowerCase() === user?.email?.toLowerCase()) {
            toast.error('You cannot share with yourself');
            return;
        }

        if (shares.some(s => s.email.toLowerCase() === email.trim().toLowerCase())) {
            toast.error('This user already has access');
            return;
        }

        setIsLoading(true);
        try {
            const newShare: TripShare = {
                email: email.trim().toLowerCase(),
                permission,
                addedAt: new Date().toISOString(),
                addedBy: user?.email || 'unknown',
            };

            const updatedShares = [...shares, newShare];
            onUpdateTrip(trip.id, { sharedWith: updatedShares });

            setEmail('');
            toast.success(`Trip shared with ${newShare.email}`);
        } catch (error) {
            console.error('Error sharing trip:', error);
            toast.error('Failed to share trip');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveShare = (emailToRemove: string) => {
        const updatedShares = shares.filter(s => s.email !== emailToRemove);
        onUpdateTrip(trip.id, { sharedWith: updatedShares });
        toast.success(`Access removed for ${emailToRemove}`);
    };

    const handleUpdatePermission = (emailToUpdate: string, newPermission: 'view' | 'edit') => {
        const updatedShares = shares.map(s =>
            s.email === emailToUpdate
                ? { ...s, permission: newPermission }
                : s
        );
        onUpdateTrip(trip.id, { sharedWith: updatedShares });
        toast.success(`Permission updated for ${emailToUpdate}`);
    };

    const handleClearAll = () => {
        onUpdateTrip(trip.id, { sharedWith: [] });
        toast.success('All shares removed');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="bg-background border-none text-foreground sm:max-w-[600px] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden">
                <DialogTitle className="sr-only">Share Trip</DialogTitle>
                <DialogDescription className="sr-only">Invite other people to collaborate on this trip.</DialogDescription>
                
                <TooltipProvider>
                    {/* Header / Actions Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>Share "{trip.name}"</span>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* More Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                                    <DropdownMenuItem 
                                        onClick={handleClearAll} 
                                        disabled={shares.length === 0}
                                        className="text-red-400 focus:text-red-400 focus:bg-accent cursor-pointer"
                                    >
                                        Remove all shares
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Close */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full" onClick={() => onOpenChange(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Close</p></TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                        <p className="text-sm text-muted-foreground -mt-2">
                            Invite other people to collaborate on this trip by entering their email address.
                        </p>
                        
                        {/* Add new share - Properties Grid */}
                        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-4">
                            <Label className="text-xs font-medium text-muted-foreground">Add person</Label>
                            
                            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                                {/* Email Input */}
                                <div className="flex items-center bg-card rounded-lg border border-border px-3 h-10 gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div className="w-px h-4 bg-border" />
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:outline-none flex-1 text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddShare();
                                            }
                                        }}
                                    />
                                </div>

                                {/* Permission Selector */}
                                <Select value={permission} onValueChange={(v) => setPermission(v as 'view' | 'edit')}>
                                    <SelectTrigger className="w-[120px] h-10 bg-card border-border rounded-lg text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="view" className="text-foreground focus:bg-accent focus:text-accent-foreground">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4" />
                                                <span>View</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="edit" className="text-foreground focus:bg-accent focus:text-accent-foreground">
                                            <div className="flex items-center gap-2">
                                                <Edit3 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Add Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleAddShare}
                                            disabled={isLoading || !email.trim()}
                                            className="bg-primary hover:bg-primary/90 rounded-lg h-10 w-10 p-0 text-primary-foreground"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Add person</p></TooltipContent>
                                </Tooltip>
                            </div>
                        </div>

                        <div className="w-full h-px bg-border" />

                        {/* Current shares list */}
                        {shares.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-xs font-medium text-muted-foreground">People with access</Label>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {shares.map((share) => (
                                        <div
                                            key={share.email}
                                            className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border group hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                                                    {share.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate text-foreground">{share.email}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Added by {share.addedBy.split('@')[0]}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={share.permission}
                                                    onValueChange={(v) => handleUpdatePermission(share.email, v as 'view' | 'edit')}
                                                >
                                                    <SelectTrigger className="w-[100px] h-8 text-xs bg-transparent border-border rounded-lg text-foreground">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                                        <SelectItem value="view" className="text-foreground text-xs focus:bg-accent focus:text-accent-foreground">
                                                            View
                                                        </SelectItem>
                                                        <SelectItem value="edit" className="text-foreground text-xs focus:bg-accent focus:text-accent-foreground">
                                                            Edit
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                                                            onClick={() => handleRemoveShare(share.email)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Remove access</p></TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {shares.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 opacity-30" />
                                </div>
                                <p className="text-sm font-medium">No people added yet</p>
                                <p className="text-xs mt-1 text-muted-foreground/70">Add someone's email above to share this trip</p>
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            </DialogContent>
        </Dialog>
    );
};
