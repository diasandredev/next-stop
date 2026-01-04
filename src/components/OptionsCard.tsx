
import { Card } from '@/types/kanban';
import { useKanban } from '@/contexts/KanbanContext';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { Button } from './ui/button';
import { Plus, Trash2, Split, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { ConfirmDialog } from './ConfirmDialog';

interface OptionsCardProps {
    card: Card;
    childCards: Card[];
}

export const OptionsCard = ({ card, childCards }: OptionsCardProps) => {
    const { addCard, deleteCard } = useKanban();
    const [isAddingTo, setIsAddingTo] = useState<string | null>(null);
    const [newCardTitle, setNewCardTitle] = useState('');

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Group child cards by optionId
    const option1Cards = childCards.filter(c => c.optionId === '1').sort((a, b) => (a.order || 0) - (b.order || 0));
    const option2Cards = childCards.filter(c => c.optionId === '2').sort((a, b) => (a.order || 0) - (b.order || 0));

    // Determine the maximum length to know when to hide the bottom border for the "last" item visually
    const maxLen = Math.max(option1Cards.length, option2Cards.length);

    // Droppables for options
    const { setNodeRef: setRef1, isOver: isOver1 } = useDroppable({
        id: `option-${card.id}-1`,
        data: { type: 'option', parentId: card.id, optionId: '1', dashboardId: card.dashboardId }
    });

    const { setNodeRef: setRef2, isOver: isOver2 } = useDroppable({
        id: `option-${card.id}-2`,
        data: { type: 'option', parentId: card.id, optionId: '2', dashboardId: card.dashboardId }
    });

    const handleAddCard = (optionId: string) => {
        if (!newCardTitle.trim()) {
            setIsAddingTo(null);
            return;
        }

        addCard({
            title: newCardTitle.trim(),
            columnType: card.columnType,
            // The date is crucial for the main filter, but parentId hides it from main view
            date: card.date,
            dashboardId: card.dashboardId,
            parentId: card.id,
            optionId: optionId,
            order: 999
        });
        setNewCardTitle('');
        setIsAddingTo(null);
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDeleteDialog(true);
    }

    const handleConfirmDelete = () => {
        deleteCard(card.id);
        // Ideally we delete children too, but hooks might need update.
        // For now, they become orphans or we rely on backend. 
        // We'll update deleteCard logic later if needed.
    }

    return (
        <>
            <div className="group/options border-b border-border/40 box-border bg-black/20 backdrop-blur-sm">

                {/* Header - H-12 (48px) */}
                <div className="h-12 flex flex-col border-b border-border/40 bg-white/5">
                    {/* Top Row: Title + Actions */}
                    <div className="h-6 flex items-center justify-between px-3 border-b border-border/10">
                        <div className="flex items-center gap-2">
                            <Split className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Options Paths</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 opacity-0 group-hover/options:opacity-100 transition-opacity hover:text-red-400"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                    {/* Bottom Row: Path Labels + Add Buttons */}
                    <div className="h-6 flex divide-x divide-border/10">
                        <div className="flex-1 flex items-center justify-between px-2 bg-white/5 group/path-a">
                            <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-widest">Path A</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 text-muted-foreground hover:text-foreground opacity-0 group-hover/path-a:opacity-100 transition-opacity"
                                onClick={() => setIsAddingTo('1')}
                            >
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                        <div className="flex-1 flex items-center justify-between px-2 bg-white/5 group/path-b">
                            <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-widest">Path B</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 text-muted-foreground hover:text-foreground opacity-0 group-hover/path-b:opacity-100 transition-opacity"
                                onClick={() => setIsAddingTo('2')}
                            >
                                <Plus className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Columns Container */}
                <div className="flex divide-x divide-border/40">
                    {/* Option 1 */}
                    <div ref={setRef1} className={`flex-1 flex flex-col min-w-0 transition-colors ${isOver1 ? 'bg-accent/10' : ''}`}>

                        {/* Content Area */}
                        <div className={`flex flex-col h-full p-0 space-y-0 text-sm min-h-0`}>
                            <SortableContext items={option1Cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                {option1Cards.map(c => <KanbanCard key={c.id} card={c} isNested />)}
                            </SortableContext>
                        </div>

                        {/* Input - Only shown when adding */}
                        {isAddingTo === '1' && (
                            <div className="h-12 flex items-center px-1 border-t border-border/40 shrink-0">
                                <Input
                                    value={newCardTitle}
                                    onChange={e => setNewCardTitle(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddCard('1');
                                        if (e.key === 'Escape') setIsAddingTo(null);
                                    }}
                                    onBlur={() => handleAddCard('1')}
                                    autoFocus
                                    className="h-8 text-xs bg-background/50"
                                    placeholder="Add to Path A..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Option 2 */}
                    <div ref={setRef2} className={`flex-1 flex flex-col min-w-0 transition-colors ${isOver2 ? 'bg-accent/10' : ''}`}>

                        {/* Content Area */}
                        <div className={`flex flex-col h-full p-0 space-y-0 text-sm min-h-0`}>
                            <SortableContext items={option2Cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                {option2Cards.map(c => <KanbanCard key={c.id} card={c} isNested />)}
                            </SortableContext>
                        </div>

                        {/* Input - Only shown when adding */}
                        {isAddingTo === '2' && (
                            <div className="h-12 flex items-center px-1 border-t border-border/40 shrink-0">
                                <Input
                                    value={newCardTitle}
                                    onChange={e => setNewCardTitle(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddCard('2');
                                        if (e.key === 'Escape') setIsAddingTo(null);
                                    }}
                                    onBlur={() => handleAddCard('2')}
                                    autoFocus
                                    className="h-8 text-xs bg-background/50"
                                    placeholder="Add to Path B..."
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete options?"
                description="This will delete this options group and all its contents. This action cannot be undone."
                onConfirm={handleConfirmDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </>
    );
}
