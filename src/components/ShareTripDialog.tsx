import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trip, TripShare } from '@/types/kanban';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, UserPlus, Eye, Edit3 } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold">Share "{trip.name}"</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Invite other people to collaborate on this trip by entering their email address.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add new share */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Add person</Label>
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddShare();
                                    }
                                }}
                            />
                            <Select value={permission} onValueChange={(v) => setPermission(v as 'view' | 'edit')}>
                                <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2a2a2a] border-white/10">
                                    <SelectItem value="view" className="text-white focus:bg-white/10 focus:text-white">
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            <span>View</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="edit" className="text-white focus:bg-white/10 focus:text-white">
                                        <div className="flex items-center gap-2">
                                            <Edit3 className="w-4 h-4" />
                                            <span>Edit</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAddShare}
                                disabled={isLoading || !email.trim()}
                                className="bg-[#304D73] hover:bg-[#264059]"
                            >
                                <UserPlus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Current shares list */}
                    {shares.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">People with access</Label>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {shares.map((share) => (
                                    <div
                                        key={share.email}
                                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-[#304D73]/30 flex items-center justify-center text-sm font-medium text-[#5a8fc4]">
                                                {share.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{share.email}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Added by {share.addedBy}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={share.permission}
                                                onValueChange={(v) => handleUpdatePermission(share.email, v as 'view' | 'edit')}
                                            >
                                                <SelectTrigger className="w-[110px] h-8 text-xs bg-transparent border-white/10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#2a2a2a] border-white/10">
                                                    <SelectItem value="view" className="text-white text-xs focus:bg-white/10 focus:text-white">
                                                        View
                                                    </SelectItem>
                                                    <SelectItem value="edit" className="text-white text-xs focus:bg-white/10 focus:text-white">
                                                        Edit
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveShare(share.email)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {shares.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No people added yet</p>
                            <p className="text-xs mt-1">Add someone's email to share this trip</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
