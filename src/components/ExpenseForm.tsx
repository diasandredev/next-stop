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
    currentUserEmail?: string;
}

export function ExpenseForm({ trip, initialData, onSubmit, onCancel, currentUserId, currentUserEmail }: ExpenseFormProps) {
    // Derived trip members
    const isOwner = currentUserId === trip.ownerId;

    // Heal old data: if we loaded an expense that incorrectly saved `currentUserEmail` instead of `ownerId`, fix it.
    const sanitizeId = (id: string | undefined) => (id === currentUserEmail && isOwner) ? (trip.ownerId || 'owner') : (id || '');

    const [description, setDescription] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [currency, setCurrency] = useState(initialData?.currency || 'BRL');
    const [installments, setInstallments] = useState(initialData?.installments?.toString() || '1');
    const [startDate, setStartDate] = useState(initialData?.startDate || format(new Date(), 'yyyy-MM-dd'));
    const [payerId, setPayerId] = useState(sanitizeId(initialData?.payerId) || currentUserId);

    // Split Logic
    const [splitType, setSplitType] = useState<'equal' | 'percentage'>(initialData?.splitType || 'equal');

    const members = useMemo(() => {
        const list = [
            { id: trip.ownerId || 'owner', email: trip.ownerId || 'owner', name: isOwner ? (currentUserEmail?.split('@')[0] || 'Owner') : 'Owner' },
            ...(trip.sharedWith?.map(s => ({ id: s.email, email: s.email, name: s.email.split('@')[0] })) || [])
        ];
        return list.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    }, [trip, isOwner, currentUserEmail]);

    const sanitizedInitialInvolved = initialData?.involvedUserIds?.map(sanitizeId);

    const [involvedUserIds, setInvolvedUserIds] = useState<string[]>(
        sanitizedInitialInvolved || [currentUserId, ...(trip.sharedWith?.map(s => s.email) || [])]
    );
    const [splitRatios, setSplitRatios] = useState<Record<string, number>>(() => {
        if (!initialData?.splitRatios) return {};
        const healed: Record<string, number> = {};
        Object.entries(initialData.splitRatios).forEach(([k, v]) => {
            healed[sanitizeId(k)] = v;
        });
        return healed;
    });

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

    // Local string state to allow typing intermediate decimals like "15." without the number casting erasing it
    const [localAmountInputs, setLocalAmountInputs] = useState<Record<string, string>>({});

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

                // Clear local input overrides when manipulating via slider, 
                // to force them to re-sync with the strict mathematical derived format
                setLocalAmountInputs({});
            }
        } else {
            setSplitRatios(prev => ({ ...prev, [userId]: val }));
            setLocalAmountInputs(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        }
    };

    const handleAmountInputChange = (userId: string, amountStr: string) => {
        // Set local string so typing feels natural (keeps trailing dots, empty string etc.)
        setLocalAmountInputs(prev => ({ ...prev, [userId]: amountStr }));

        const parsedAmount = parseFloat(amount) || 0;
        const parsedInstallments = parseInt(installments) || 1;
        const totalAmountPerInstallment = parsedAmount / parsedInstallments;

        if (totalAmountPerInstallment === 0) return;

        let inputAmount = parseFloat(amountStr);
        if (isNaN(inputAmount)) inputAmount = 0;

        if (inputAmount < 0) inputAmount = 0;
        if (inputAmount > totalAmountPerInstallment) inputAmount = totalAmountPerInstallment;

        // Automatically snap back the other slider if its a 2 person trip
        const newPercentage = Math.round((inputAmount / totalAmountPerInstallment) * 100);

        if (involvedUserIds.length === 2) {
            const otherUserId = involvedUserIds.find(id => id !== userId);
            if (otherUserId) {
                setSplitRatios({
                    [userId]: newPercentage,
                    [otherUserId]: 100 - newPercentage
                });
                // Also clear the OTHER user's local override so it re-syncs to the math.
                setLocalAmountInputs(prev => {
                    const next = { ...prev };
                    delete next[otherUserId];
                    return next;
                })
            }
        } else {
            setSplitRatios(prev => ({ ...prev, [userId]: newPercentage }));
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

    const parsedAmount = parseFloat(amount) || 0;
    const parsedInstallments = parseInt(installments) || 1;
    const amountPerInstallment = parsedAmount / parsedInstallments;

    const formatCurrency = (val: number, cur: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(val);
    };

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
            ...(splitType === 'percentage' ? { splitRatios } : {}),
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
                    className="font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50 h-auto w-full text-2xl leading-tight text-foreground"
                />
            </div>

            {/* Properties Grid 1: Amount & Currency */}
            <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border">
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Amount</Label>
                    <div className="flex items-center bg-card rounded-lg border border-border px-3 h-10 gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="w-px h-4 bg-border" />
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-muted-foreground/30 text-foreground"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Currency</Label>
                    <div className="bg-card rounded-lg border border-border">
                        <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="bg-transparent border-none h-10 text-sm font-medium focus:ring-0 text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                <SelectItem value="BRL" className="text-foreground focus:bg-accent focus:text-accent-foreground">BRL (R$)</SelectItem>
                                <SelectItem value="USD" className="text-foreground focus:bg-accent focus:text-accent-foreground">USD ($)</SelectItem>
                                <SelectItem value="EUR" className="text-foreground focus:bg-accent focus:text-accent-foreground">EUR (€)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Properties Grid 2: Installments & Start Date */}
            <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border">
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Installments</Label>
                    <div className="flex items-center bg-card rounded-lg border border-border px-3 h-10 gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="w-px h-4 bg-border" />
                        <input
                            type="number"
                            min={1}
                            value={installments}
                            onChange={e => setInstallments(e.target.value)}
                            className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-muted-foreground/30 text-foreground"
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Start Date</Label>
                    <div className="flex items-center bg-card rounded-lg border border-border px-3 h-10 gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="w-px h-4 bg-border" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none text-foreground"
                        />
                    </div>
                </div>
            </div>

            {/* Paid By */}
            <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground ml-1">Paid By</Label>
                <div className="bg-card rounded-lg border border-border">
                    <Select value={payerId} onValueChange={setPayerId}>
                        <SelectTrigger className="bg-transparent border-none h-10 text-sm font-medium focus:ring-0 text-foreground">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            {members.map(m => (
                                <SelectItem key={m.id} value={m.id} className="text-foreground focus:bg-accent focus:text-accent-foreground">
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
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm ${involvedUserIds.includes(member.id)
                                ? 'bg-primary/20 border border-primary/50'
                                : 'bg-muted/20 border border-border opacity-60 hover:opacity-100'
                                }`}
                            onClick={() => toggleMember(member.id)}
                        >
                            <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${involvedUserIds.includes(member.id)
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground/30'
                                }`}>
                                {involvedUserIds.includes(member.id) && (
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                )}
                            </div>
                            <span className="font-medium text-foreground">{member.name || member.email}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Split Strategy */}
            <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Split Strategy</Label>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm transition-colors ${splitType === 'equal' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Equal</span>
                        <Switch
                            checked={splitType === 'percentage'}
                            onCheckedChange={(checked) => setSplitType(checked ? 'percentage' : 'equal')}
                        />
                        <span className={`text-sm transition-colors ${splitType === 'percentage' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Custom %</span>
                    </div>
                </div>

                {splitType === 'percentage' && (
                    <div className="space-y-3 pt-1">
                        {involvedUserIds.map(userId => {
                            const member = members.find(m => m.id === userId);
                            const ratio = splitRatios[userId] || 0;
                            const userAmount = amountPerInstallment * (ratio / 100);
                            return (
                                <div key={userId} className="space-y-1">
                                    <div className="flex justify-between text-sm items-end">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-medium mb-0.5">{member?.name || userId}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono bg-background/50 px-2 py-0.5 rounded-md border border-border/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                                                <span>{currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€'}</span>
                                                <input
                                                    type="text"
                                                    value={localAmountInputs[userId] ?? (userAmount ? Number(userAmount.toFixed(2)) : '')}
                                                    onChange={(e) => handleAmountInputChange(userId, e.target.value)}
                                                    className="w-16 bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-foreground text-right"
                                                    placeholder="0.00"
                                                />
                                                <span className="text-muted-foreground/60">{parsedInstallments > 1 ? '/mo' : ''}</span>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-foreground">{ratio}%</span>
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
                        <div className={`flex justify-between items-center text-xs font-bold mt-2 pt-2 border-t border-border/50 ${Math.abs(totalPercentage - 100) > 1 ? 'text-red-400' : 'text-primary'}`}>
                            <span className="font-mono">Total {parsedInstallments > 1 ? '/mo' : ''}: {formatCurrency(amountPerInstallment, currency)}</span>
                            <span>Total %: {totalPercentage}%</span>
                        </div>
                    </div>
                )}

                {splitType === 'equal' && involvedUserIds.length > 0 && (
                    <div className="flex items-center justify-between mt-3 p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="text-sm text-foreground">
                            Split equally among <span className="font-bold">{involvedUserIds.length}</span> member{involvedUserIds.length !== 1 ? 's' : ''}.
                        </div>
                        <div className="text-sm font-mono font-bold text-primary">
                            {formatCurrency(amountPerInstallment / involvedUserIds.length, currency)}
                            <span className="text-xs text-muted-foreground font-sans ml-1">{parsedInstallments > 1 ? '/mo' : ''}</span>
                        </div>
                    </div>
                )}
                {splitType === 'equal' && involvedUserIds.length === 0 && (
                    <div className="text-sm text-muted-foreground mt-3">
                        Select members to split equally.
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel} className="rounded-lg hover:bg-muted">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 px-6 font-medium">
                    Save Expense
                </Button>
            </div>
        </div>
    );
}
