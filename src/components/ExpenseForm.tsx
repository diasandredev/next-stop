import { useState, useEffect, useMemo } from 'react';
import { Expense } from '@/types/finance';
import { Trip } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DollarSign, Calendar, CreditCard, Users } from 'lucide-react';

interface ExpenseFormProps {
    trip: Trip;
    initialData?: Expense;
    onSubmit: (expense: Expense) => void;
    onCancel: () => void;
    currentUserId: string;
}

export function ExpenseForm({ trip, initialData, onSubmit, onCancel, currentUserId }: ExpenseFormProps) {
    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [currency, setCurrency] = useState(initialData?.currency || 'BRL');
    const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');
    const [startDate, setStartDate] = useState(initialData?.startDate || format(new Date(), 'yyyy-MM-dd'));
    const [payerId, setPayerId] = useState(initialData?.payerId || currentUserId);
    
    // Split Logic
    const [splitType, setSplitType] = useState<'equal' | 'percentage'>(initialData?.splitType || 'equal');
    const [involvedUserIds, setInvolvedUserIds] = useState<string[]>(
        initialData?.involvedUserIds || [currentUserId, ...(trip.sharedWith?.map(s => s.email) || [])]
    );
    const [splitRatios, setSplitRatios] = useState<Record<string, number>>(
        initialData?.splitRatios || {}
    );

    // Derived trip members
    const members = useMemo(() => {
        const list = [
            { id: trip.ownerId || 'owner', email: trip.ownerId || 'owner', name: 'Owner' },
            ...(trip.sharedWith?.map(s => ({ id: s.email, email: s.email, name: s.email.split('@')[0] })) || [])
        ];
        return list.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [trip]);

    // Initialize ratios if empty and switching to percentage
    useEffect(() => {
        if (splitType === 'percentage' && Object.keys(splitRatios).length === 0) {
            const count = involvedUserIds.length;
            if (count > 0) {
                const equalShare = Math.floor(100 / count);
                const remainder = 100 - (equalShare * count);
                
                const newRatios: Record<string, number> = {};
                involvedUserIds.forEach((id, idx) => {
                    newRatios[id] = equalShare + (idx === 0 ? remainder : 0);
                });
                setSplitRatios(newRatios);
            }
        }
    }, [splitType, involvedUserIds]);

    const handleSliderChange = (userId: string, newValue: number[]) => {
        const val = newValue[0];
        
        // Smart split logic for 2 people
        if (involvedUserIds.length === 2) {
            const otherUserId = involvedUserIds.find(id => id !== userId);
            if (otherUserId) {
                setSplitRatios({
                    [userId]: val,
                    [otherUserId]: 100 - val
                });
            }
        } else {
            setSplitRatios(prev => ({ ...prev, [userId]: val }));
        }
    };

    const toggleMember = (userId: string) => {
        if (involvedUserIds.includes(userId)) {
            setInvolvedUserIds(prev => prev.filter(id => id !== userId));
            const newRatios = { ...splitRatios };
            delete newRatios[userId];
            setSplitRatios(newRatios);
        } else {
            setInvolvedUserIds(prev => [...prev, userId]);
        }
    };

    const totalPercentage = Object.values(splitRatios).reduce((a, b) => a + b, 0);

    const handleSubmit = () => {
        if (!description || !amount) {
            toast.error("Please fill in description and amount");
            return;
        }

        if (splitType === 'percentage' && Math.abs(totalPercentage - 100) > 1) {
            toast.error(`Total split percentage must be 100% (Current: ${totalPercentage}%)`);
            return;
        }

        const expense: Expense = {
            id: initialData?.id || uuidv4(),
            tripId: trip.id,
            description,
            amount: parseFloat(amount),
            currency,
            installments: parseInt(installments),
            startDate,
            payerId,
            involvedUserIds,
            splitType,
            splitRatios: splitType === 'percentage' ? splitRatios : undefined,
            createdAt: initialData?.createdAt || new Date().toISOString(),
            createdBy: initialData?.createdBy || currentUserId
        };

        onSubmit(expense);
    };

    return (
        <div className="space-y-4">
            {/* Hero Section: Description */}
            <div className="space-y-1">
                <input 
                    autoFocus
                    placeholder="Expense description" 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 h-auto w-full text-2xl leading-tight text-white"
                />
            </div>

            {/* Properties Grid 1: Amount & Currency */}
            <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Amount</Label>
                    <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10 px-3 h-10 gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="w-px h-4 bg-white/10" />
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-muted-foreground/30 text-white"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Currency</Label>
                    <div className="bg-[#1a1a1a] rounded-lg border border-white/10">
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="bg-transparent border-none h-10 text-sm font-medium focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2a2a2a] border-white/10">
                                <SelectItem value="BRL" className="text-white focus:bg-white/10 focus:text-white">BRL (R$)</SelectItem>
                                <SelectItem value="USD" className="text-white focus:bg-white/10 focus:text-white">USD ($)</SelectItem>
                                <SelectItem value="EUR" className="text-white focus:bg-white/10 focus:text-white">EUR (€)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Properties Grid 2: Installments & Start Date */}
            <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Installments</Label>
                    <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10 px-3 h-10 gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="w-px h-4 bg-white/10" />
                        <input 
                            type="number" 
                            min={1} 
                            value={installments}
                            onChange={e => setInstallments(e.target.value)}
                            className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-muted-foreground/30 text-white"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Start Date</Label>
                    <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10 px-3 h-10 gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="w-px h-4 bg-white/10" />
                        <input 
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none text-white [color-scheme:dark]"
                        />
                    </div>
                </div>
            </div>

            {/* Paid By */}
            <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground ml-1">Paid By</Label>
                <div className="bg-[#1a1a1a] rounded-lg border border-white/10">
                    <Select value={payerId} onValueChange={setPayerId}>
                        <SelectTrigger className="bg-transparent border-none h-10 text-sm font-medium focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a2a2a] border-white/10">
                            {members.map(m => (
                                <SelectItem key={m.id} value={m.id} className="text-white focus:bg-white/10 focus:text-white">
                                    {m.name || m.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Involved Members */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Involved Members</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {members.map(member => (
                        <div 
                            key={member.id} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${
                                involvedUserIds.includes(member.id) 
                                    ? 'bg-primary/20 border border-primary/50' 
                                    : 'bg-white/5 border border-white/5 opacity-60 hover:opacity-100'
                            }`}
                            onClick={() => toggleMember(member.id)}
                        >
                            <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${
                                involvedUserIds.includes(member.id) 
                                    ? 'bg-primary border-primary' 
                                    : 'border-white/30'
                            }`}>
                                {involvedUserIds.includes(member.id) && (
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                )}
                            </div>
                            <span className="font-medium">{member.name || member.email}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Split Strategy */}
            <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Split Strategy</Label>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm transition-colors ${splitType === 'equal' ? 'font-bold text-white' : 'text-muted-foreground'}`}>Equal</span>
                        <Switch 
                            checked={splitType === 'percentage'}
                            onCheckedChange={(checked) => setSplitType(checked ? 'percentage' : 'equal')}
                        />
                        <span className={`text-sm transition-colors ${splitType === 'percentage' ? 'font-bold text-white' : 'text-muted-foreground'}`}>Custom %</span>
                    </div>
                </div>

                {splitType === 'percentage' && (
                    <div className="space-y-3 pt-1">
                        {involvedUserIds.map(userId => {
                            const member = members.find(m => m.id === userId);
                            const ratio = splitRatios[userId] || 0;
                            return (
                                <div key={userId} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white font-medium">{member?.name || userId}</span>
                                        <span className="font-mono font-bold text-white">{ratio}%</span>
                                    </div>
                                    <Slider 
                                        value={[ratio]} 
                                        max={100} 
                                        step={1}
                                        onValueChange={(val) => handleSliderChange(userId, val)}
                                        className="py-1"
                                    />
                                </div>
                            );
                        })}
                        <div className={`text-right text-xs font-bold ${Math.abs(totalPercentage - 100) > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                            Total: {totalPercentage}%
                        </div>
                    </div>
                )}
                
                {splitType === 'equal' && (
                    <div className="text-sm text-muted-foreground">
                        Split equally between {involvedUserIds.length} member{involvedUserIds.length !== 1 ? 's' : ''}.
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel} className="rounded-lg hover:bg-white/5">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 px-6 font-medium">
                    Save Expense
                </Button>
            </div>
        </div>
    );
}
