import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { ReminderItem, Reminder, Card } from '@/types/kanban';
import { EditCardDialog } from '@/components/EditCardDialog';
import {
    ListChecks,
    Plus,
    Trash2,
    ExternalLink,
    GripVertical,
    Type,
    CheckSquare,
    Clock,
    MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const Reminders = () => {
    const { currentTripId, reminders, saveReminder, cards, dashboards } = useKanban();

    // Find the reminder doc for the current trip
    const reminder = useMemo(
        () => reminders.find(r => r.tripId === currentTripId),
        [reminders, currentTripId]
    );

    const [items, setItems] = useState<ReminderItem[]>([]);
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const inputRefs = useRef<Map<string, HTMLInputElement | HTMLTextAreaElement>>(new Map());
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const focusNextRef = useRef<string | null>(null);

    // Drag state
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Sync local state from remote
    useEffect(() => {
        if (reminder) {
            setItems(reminder.items || []);
        } else {
            setItems([]);
        }
    }, [reminder]);

    // Focus management after state updates
    useEffect(() => {
        if (focusNextRef.current) {
            const el = inputRefs.current.get(focusNextRef.current);
            if (el) {
                el.focus();
                const len = (el as HTMLInputElement).value?.length || 0;
                (el as HTMLInputElement).setSelectionRange?.(len, len);
            }
            focusNextRef.current = null;
        }
    });

    // Debounced save
    const debouncedSave = useCallback(
        (newItems: ReminderItem[]) => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                const now = new Date().toISOString();
                const doc: Reminder = reminder
                    ? { ...reminder, items: newItems, updatedAt: now }
                    : {
                        id: crypto.randomUUID(),
                        tripId: currentTripId,
                        items: newItems,
                        createdAt: now,
                        updatedAt: now,
                    };
                saveReminder(currentTripId, doc);
            }, 600);
        },
        [reminder, currentTripId, saveReminder]
    );

    const updateItems = useCallback(
        (newItems: ReminderItem[]) => {
            setItems(newItems);
            debouncedSave(newItems);
        },
        [debouncedSave]
    );

    // -- Item operations --
    const addItem = useCallback(
        (type: 'text' | 'check', afterIndex?: number) => {
            const newItem: ReminderItem = {
                id: crypto.randomUUID(),
                type,
                content: '',
                completed: false,
            };
            const newItems = [...items];
            const insertAt = afterIndex !== undefined ? afterIndex + 1 : newItems.length;
            newItems.splice(insertAt, 0, newItem);
            focusNextRef.current = newItem.id;
            updateItems(newItems);
        },
        [items, updateItems]
    );

    const updateItemContent = useCallback(
        (id: string, content: string) => {
            updateItems(items.map(i => (i.id === id ? { ...i, content } : i)));
        },
        [items, updateItems]
    );

    const toggleItem = useCallback(
        (id: string) => {
            updateItems(
                items.map(i => (i.id === id ? { ...i, completed: !i.completed } : i))
            );
        },
        [items, updateItems]
    );

    const deleteItem = useCallback(
        (id: string) => {
            updateItems(items.filter(i => i.id !== id));
        },
        [items, updateItems]
    );

    const toggleItemType = useCallback(
        (id: string) => {
            updateItems(
                items.map(i =>
                    i.id === id
                        ? { ...i, type: i.type === 'text' ? 'check' : 'text' as const }
                        : i
                )
            );
        },
        [items, updateItems]
    );

    // -- Drag and drop --
    const handleDragStart = useCallback((index: number) => {
        setDragIndex(index);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    }, []);

    const handleDragEnd = useCallback(() => {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            const newItems = [...items];
            const [moved] = newItems.splice(dragIndex, 1);
            newItems.splice(dragOverIndex, 0, moved);
            updateItems(newItems);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    }, [dragIndex, dragOverIndex, items, updateItems]);

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    // Handle Enter key on an item input
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, item: ReminderItem, index: number) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                addItem(item.type, index);
            }
            if (e.key === 'Backspace' && item.content === '') {
                e.preventDefault();
                deleteItem(item.id);
                if (index > 0) {
                    focusNextRef.current = items[index - 1].id;
                }
            }
        },
        [addItem, deleteItem, items]
    );

    // Find a card by ID for opening EditCardDialog
    const findCard = useCallback(
        (cardId: string) => cards.find(c => c.id === cardId),
        [cards]
    );

    // Get dashboard name (city) for a reminder item
    const getDashboardName = useCallback(
        (dashboardId?: string) => {
            if (!dashboardId) return null;
            const dashboard = dashboards.find(d => d.id === dashboardId);
            return dashboard?.name || null;
        },
        [dashboards]
    );

    // Get card time for a reminder item
    const getCardTime = useCallback(
        (cardId?: string) => {
            if (!cardId) return null;
            const card = cards.find(c => c.id === cardId);
            return card?.time || null;
        },
        [cards]
    );

    // Check if item is the first 'check' item after a 'text' heading (for indentation)
    const isUnderHeading = useCallback(
        (index: number) => {
            if (items[index].type !== 'check') return false;
            // Walk backwards to find the nearest heading
            for (let i = index - 1; i >= 0; i--) {
                if (items[i].type === 'text') return true;
                // If we hit another check, it's still under the same heading
            }
            return false;
        },
        [items]
    );

    const isFirstAfterStart = useCallback(
        (index: number) => {
            if (items[index].type !== 'text') return false;
            return index > 0; // All headings except the very first get top spacing
        },
        [items]
    );

    const completedCount = items.filter(i => i.type === 'check' && i.completed).length;
    const totalChecks = items.filter(i => i.type === 'check').length;

    return (
        <TooltipProvider>
            <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
                {/* Header */}
                <div className="px-4 md:px-8 pt-6 md:pt-8 pb-4 border-b border-border bg-background/80 backdrop-blur-sm">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ListChecks className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                                    Reminders
                                </h1>
                                {totalChecks > 0 && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {completedCount}/{totalChecks} completed
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                    <div className="max-w-3xl mx-auto">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragLeave={handleDragLeave}
                                className={cn(
                                    'group flex items-start gap-2 rounded-lg transition-all px-2 py-1.5 -mx-2',
                                    // Indentation
                                    item.type === 'check' && isUnderHeading(index) && 'pl-8',
                                    // Heading top spacing
                                    isFirstAfterStart(index) && 'mt-6',
                                    // Drag visual feedback
                                    dragIndex === index && 'opacity-40 scale-[0.98]',
                                    dragOverIndex === index && dragIndex !== index && 'border-t-2 border-primary',
                                    dragIndex === null && 'hover:bg-muted/30',
                                )}
                            >
                                {/* Drag handle */}
                                <div
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    className="pt-2 opacity-0 group-hover:opacity-40 transition-opacity cursor-grab active:cursor-grabbing select-none"
                                >
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>

                                {/* Checkbox or text indicator */}
                                {item.type === 'check' ? (
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className={cn(
                                            'mt-2.5 flex-shrink-0 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-200',
                                            item.completed
                                                ? 'bg-primary border-primary text-primary-foreground scale-95'
                                                : 'border-muted-foreground/30 hover:border-primary/60'
                                        )}
                                    >
                                        {item.completed && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                                <path
                                                    d="M2 5L4.5 7.5L8 3"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                ) : (
                                    <div className="mt-2 flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center" />
                                )}

                                {/* Card info badges: city, title, time */}
                                {item.cardId && item.cardTitle && (() => {
                                    const cityName = getDashboardName(item.dashboardId);
                                    const cardTime = getCardTime(item.cardId);
                                    return (
                                        <div className="mt-1.5 flex items-center gap-1 flex-shrink-0">
                                            {cityName && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    <MapPin className="w-2.5 h-2.5" />
                                                    {cityName}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    const card = findCard(item.cardId!);
                                                    if (card) setEditingCard(card);
                                                }}
                                                className="text-[11px] font-medium text-primary/70 bg-primary/8 hover:bg-primary/15 px-1.5 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap"
                                            >
                                                [{item.cardTitle}]
                                            </button>
                                            {cardTime && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {cardTime}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Content input */}
                                <input
                                    ref={el => {
                                        if (el) inputRefs.current.set(item.id, el);
                                        else inputRefs.current.delete(item.id);
                                    }}
                                    value={item.content}
                                    onChange={e => updateItemContent(item.id, e.target.value)}
                                    onKeyDown={e => handleKeyDown(e, item, index)}
                                    placeholder={item.type === 'text' ? 'Heading...' : 'To do...'}
                                    className={cn(
                                        'flex-1 bg-transparent border-none outline-none py-1.5 placeholder:text-muted-foreground/30 transition-all',
                                        item.type === 'text'
                                            ? 'text-base font-semibold text-foreground'
                                            : 'text-sm text-foreground',
                                        item.completed && 'line-through text-muted-foreground/50'
                                    )}
                                />

                                {/* Actions */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                    {/* Card link button */}
                                    {item.cardId && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-md"
                                                    onClick={() => {
                                                        const card = findCard(item.cardId!);
                                                        if (card) setEditingCard(card);
                                                    }}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">{item.cardTitle || 'Open card'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}

                                    {/* Toggle type */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md"
                                                onClick={() => toggleItemType(item.id)}
                                            >
                                                {item.type === 'text' ? (
                                                    <CheckSquare className="w-3.5 h-3.5" />
                                                ) : (
                                                    <Type className="w-3.5 h-3.5" />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">
                                                Switch to {item.type === 'text' ? 'checkbox' : 'text'}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>

                                    {/* Delete */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md"
                                        onClick={() => deleteItem(item.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Add buttons */}
                        {items.length > 0 && <div className="flex items-center gap-2 pt-4 pl-8">
                            <button
                                onClick={() => addItem('check')}
                                className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/30"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add item</span>
                            </button>
                            <button
                                onClick={() => addItem('text')}
                                className="flex items-center gap-2 text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors py-2 px-3 rounded-lg hover:bg-muted/30"
                            >
                                <Type className="w-4 h-4" />
                                <span>Add heading</span>
                            </button>
                        </div>}

                        {/* Empty state */}
                        {items.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                                    <ListChecks className="w-8 h-8 text-muted-foreground/30" />
                                </div>
                                <p className="text-muted-foreground/60 text-sm mb-1">
                                    No reminders yet
                                </p>
                                <p className="text-muted-foreground/40 text-xs mb-6 max-w-[280px]">
                                    Add items here or send checklist items from your cards
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => addItem('check')}
                                        className="flex items-center gap-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors py-2 px-4 rounded-lg"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add item
                                    </button>
                                    <button
                                        onClick={() => addItem('text')}
                                        className="flex items-center gap-2 text-sm bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors py-2 px-4 rounded-lg"
                                    >
                                        <Type className="w-4 h-4" />
                                        Add heading
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Card Dialog */}
            {editingCard && (
                <EditCardDialog
                    open={!!editingCard}
                    onOpenChange={open => {
                        if (!open) setEditingCard(null);
                    }}
                    card={editingCard}
                />
            )}
        </TooltipProvider>
    );
};

export default Reminders;
