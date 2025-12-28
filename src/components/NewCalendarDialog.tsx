import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useKanban } from '@/contexts/KanbanContext';

interface NewCalendarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewCalendarDialog({ open, onOpenChange }: NewCalendarDialogProps) {
    const { addCalendar } = useKanban();
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            addCalendar(name.trim());
            setName('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">New calendar</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Work, Personal"
                            autoFocus
                            className="text-3xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/20 h-auto"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/10 text-muted-foreground hover:text-white">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
