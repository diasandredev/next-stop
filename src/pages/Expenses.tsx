import { useState, useMemo } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { useAuth } from '@/contexts/AuthContext';
import { format, addMonths, subMonths, parseISO, differenceInMonths, startOfMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { calculateMonthlyBalances } from '@/services/financeService';
import { Expense } from '@/types/finance';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Receipt, MoreVertical, Pencil, Trash2, Wallet, DollarSign, PieChart, TrendingUp, X, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TripSettingsDialog } from '@/components/TripSettingsDialog';
import { ExpenseForm } from '@/components/ExpenseForm';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { cn } from '@/lib/utils';

export default function Expenses() {
    const { user } = useAuth();
    const { 
        trips, 
        currentTripId, 
        expenses, 
        saveExpense, 
        deleteExpense 
    } = useKanban();
    
    const currentTrip = trips.find(t => t.id === currentTripId);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Dialog States
    const [showTripSettingsDialog, setShowTripSettingsDialog] = useState(false);
    
    // State for Month Selection
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

    // Derived Data
    const tripExpenses = useMemo(() => {
        return expenses.filter(e => e.tripId === currentTripId);
    }, [expenses, currentTripId]);

    const balances = useMemo(() => {
        if (!currentTrip) return { month: selectedMonth, debts: [] };
        return calculateMonthlyBalances(tripExpenses, selectedMonth, currentTrip);
    }, [tripExpenses, selectedMonth, currentTrip]);

    // Helpers
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    };

    const handlePrevMonth = () => setSelectedMonth(m => format(subMonths(parseISO(m + '-01'), 1), 'yyyy-MM'));
    const handleNextMonth = () => setSelectedMonth(m => format(addMonths(parseISO(m + '-01'), 1), 'yyyy-MM'));

    const handleSaveExpense = async (expense: Expense) => {
        if (!currentTripId) return;
        await saveExpense(currentTripId, expense);
        setIsAddExpenseOpen(false);
        setEditingExpense(null);
        toast.success(editingExpense ? "Expense updated" : "Expense added");
    };

    const handleDeleteExpense = async () => {
        if (!currentTripId || !deletingExpenseId) return;
        await deleteExpense(currentTripId, deletingExpenseId);
        setDeletingExpenseId(null);
        toast.success("Expense deleted");
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b] relative">
             
            {!currentTrip ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 relative z-10">
                    <Wallet className="w-16 h-16 opacity-10" />
                    <p className="font-medium">Select a trip to manage expenses.</p>
                </div>
            ) : (
                <>
                    {/* Header */}
                    <header className="px-6 py-4 flex-shrink-0 sticky top-0 z-20 bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-md border-b border-border/30">
                        <div className="flex items-center justify-between">
                            {/* Left Section - Trip Info */}
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    {currentTrip.name}
                                </h1>
                                {currentTrip.startDate && (
                                    <div className="flex items-center gap-2 bg-secondary/60 text-secondary-foreground h-8 px-3 rounded-lg border border-border/50">
                                        <Calendar className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium">
                                            {formatInTimeZone(new Date(currentTrip.startDate), timeZone, 'MMM d')}
                                            {currentTrip.endDate && ` - ${formatInTimeZone(new Date(currentTrip.endDate), timeZone, 'MMM d')}`}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Right Section - Actions */}
                            <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1 border border-border/30">
                                <div className="flex items-center gap-2 px-3 text-sm text-muted-foreground">
                                    <Wallet className="w-4 h-4" />
                                    <span className="hidden sm:inline">Expenses</span>
                                </div>
                                <div className="w-px h-6 bg-white/10 mx-1" />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                onClick={() => {
                                                    setEditingExpense(null);
                                                    setIsAddExpenseOpen(true);
                                                }}
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 rounded-lg hover:bg-primary/20 transition-all duration-200"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            <p>Add Expense</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </header>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-auto p-8 custom-scrollbar relative z-10">
                        <div className="max-w-7xl mx-auto space-y-12 pb-20">
                            
                            {/* Monthly Overview Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <PieChart className="w-4 h-4" />
                                        Monthly Overview
                                    </h2>
                                    
                                    {/* Month Switcher */}
                                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 hover:text-white rounded-lg" onClick={handlePrevMonth}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="px-4 font-mono font-bold min-w-[140px] text-center text-white">
                                            {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5 hover:text-white rounded-lg" onClick={handleNextMonth}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {balances.debts.length === 0 ? (
                                        <div className="col-span-full border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-white/[0.02]">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <CheckIcon className="w-8 h-8 text-emerald-500/50" />
                                            </div>
                                            <h3 className="text-lg font-medium text-white mb-1">All Settled Up</h3>
                                            <p className="text-muted-foreground">No debts calculated for {format(parseISO(selectedMonth + '-01'), 'MMMM')}.</p>
                                        </div>
                                    ) : (
                                        balances.debts.map((debt, idx) => (
                                            <div key={idx} className="group relative overflow-hidden rounded-2xl bg-[#121214] border border-white/5 p-6 hover:border-primary/30 transition-all duration-300 shadow-xl">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent opacity-50" />
                                                
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settlement</span>
                                                    <Badge variant="outline" className="font-mono text-[10px] border-white/10 bg-white/5 text-white/70">
                                                        {debt.currency}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 font-bold border border-red-500/20">
                                                                {debt.debtorId.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-muted-foreground">From</span>
                                                                <span className="font-medium text-white">{debt.debtorId.split('@')[0]}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="h-px flex-1 bg-white/10 mx-4 relative">
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-muted-foreground">To</span>
                                                                <span className="font-medium text-white">{debt.creditorId.split('@')[0]}</span>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                                                                {debt.creditorId.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">Amount Due</span>
                                                        <span className="text-2xl font-bold font-mono text-white tracking-tight">
                                                            {formatCurrency(debt.amount, debt.currency)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Transactions List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Receipt className="w-4 h-4" />
                                        Transactions
                                    </h2>
                                </div>
                                
                                <div className="grid gap-3">
                                    {tripExpenses.filter(e => {
                                        const start = parseISO(e.startDate);
                                        const current = parseISO(selectedMonth + '-01');
                                        const diff = differenceInMonths(current, startOfMonth(start));
                                        return diff >= 0 && diff < e.installments;
                                    }).map(expense => (
                                        <div 
                                            key={expense.id} 
                                            className="group flex items-center justify-between p-4 rounded-xl bg-[#121214] border border-white/5 hover:bg-white/5 transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-primary/20 transition-colors">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                
                                                <div>
                                                    <div className="font-bold text-lg text-white leading-tight mb-1">{expense.description}</div>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                                            {expense.payerId.split('@')[0]}
                                                        </span>
                                                        
                                                        {expense.installments > 1 && (
                                                            <span className="bg-white/5 px-2 py-0.5 rounded text-white/70">
                                                                {expense.installments}x installments
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="font-bold font-mono text-lg text-white tracking-tight">
                                                        {formatCurrency(expense.amount / expense.installments, expense.currency)}
                                                        {expense.installments > 1 && <span className="text-xs text-muted-foreground ml-1">/mo</span>}
                                                    </div>
                                                    <div className="text-xs font-mono text-muted-foreground">
                                                        Total: {formatCurrency(expense.amount, expense.currency)}
                                                    </div>
                                                </div>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
                                                        <DropdownMenuItem onClick={() => {
                                                            setEditingExpense(expense);
                                                            setIsAddExpenseOpen(true);
                                                        }} className="focus:bg-white/10 focus:text-white cursor-pointer">
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                            onClick={() => setDeletingExpenseId(expense.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                    
                                     {tripExpenses.filter(e => {
                                        const start = parseISO(e.startDate);
                                        const current = parseISO(selectedMonth + '-01');
                                        const diff = differenceInMonths(current, startOfMonth(start));
                                        return diff >= 0 && diff < e.installments;
                                    }).length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                            <TrendingUp className="w-10 h-10 text-muted-foreground/20 mb-3" />
                                            <p className="text-muted-foreground">No active expenses for {format(parseISO(selectedMonth + '-01'), 'MMMM')}.</p>
                                            <Button variant="link" onClick={() => setIsAddExpenseOpen(true)} className="mt-2 text-primary">
                                                Add the first one
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add/Edit Expense Dialog */}
                    <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                        <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[600px] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden">
                            <DialogTitle className="sr-only">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                            
                            <TooltipProvider>
                                {/* Header Bar */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Receipt className="w-4 h-4" />
                                        <span>{editingExpense ? 'Edit Expense' : 'New Expense'}</span>
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsAddExpenseOpen(false)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Close</p></TooltipContent>
                                    </Tooltip>
                                </div>
                                
                                {/* Content */}
                                <div className="p-6 max-h-[85vh] overflow-y-auto">
                                    <ExpenseForm 
                                        trip={currentTrip}
                                        initialData={editingExpense || undefined}
                                        currentUserId={user?.email || ''} // Use email as ID for consistency in this MVP
                                        onSubmit={handleSaveExpense}
                                        onCancel={() => setIsAddExpenseOpen(false)}
                                    />
                                </div>
                            </TooltipProvider>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation */}
                    <AlertDialog open={!!deletingExpenseId} onOpenChange={(open) => !open && setDeletingExpenseId(null)}>
                        <AlertDialogContent className="bg-[#121214] border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                    This action cannot be undone. This will permanently delete the expense and recalculate all balances.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-white hover:text-white">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteExpense} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}

            {/* Global Dialogs */}
            {currentTrip && (
                <TripSettingsDialog
                    open={showTripSettingsDialog}
                    onOpenChange={setShowTripSettingsDialog}
                    trip={currentTrip}
                />
            )}
        </div>
    );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  }
