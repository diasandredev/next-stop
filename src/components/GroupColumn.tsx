import { Group } from '@/types/group';
import { Card } from '@/types/kanban';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { KanbanCard } from './KanbanCard';
import { QuickAddCard } from './QuickAddCard';
import { useKanban } from '@/contexts/KanbanContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ConfirmDialog } from './ConfirmDialog';

interface GroupColumnProps {
    group: Group;
    cards: Card[];
    onUpdateGroup: (id: string, updates: Partial<Group>) => void;
    onDeleteGroup: (id: string) => void;
    autoFocusName?: boolean;
}

export const GroupColumn = ({ group, cards, onUpdateGroup, onDeleteGroup, autoFocusName = false }: GroupColumnProps) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(group.name);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { addCard } = useKanban();

    const { setNodeRef, isOver } = useDroppable({
        id: `group-${group.id}`,
        data: {
            type: 'group',
            groupId: group.id,
            dashboardId: group.dashboardId
        }
    });

    // Auto-focus name when new group is created
    useEffect(() => {
        if (autoFocusName) {
            setIsEditingName(true);
        }
    }, [autoFocusName]);

    const sortedCards = cards.sort((a, b) => {
        const ao = a.order ?? Number.MAX_SAFE_INTEGER;
        const bo = b.order ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const handleNameSave = () => {
        if (name.trim() && name !== group.name) {
            onUpdateGroup(group.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handleQuickAdd = (title: string) => {
        addCard({
            title,
            groupId: group.id,
            dashboardId: group.dashboardId,
            order: cards.length
        });
    };

    const handleDelete = () => {
        onDeleteGroup(group.id);
    };

    // Dynamic height based on number of cards (min 150px, max 400px)
    const cardHeight = 48; // h-12 = 48px
    const minHeight = 150;
    const maxHeight = 400;
    const calculatedHeight = Math.min(maxHeight, Math.max(minHeight, sortedCards.length * cardHeight + 100));

    return (
        <div
            className={`w-full flex flex-col bg-card/40 rounded-xl border transition-all duration-200 ${isOver ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30' : 'border-border/50'
                } p-4`}
            style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
        >
            {/* Group Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30 group/header">
                {isEditingName ? (
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleNameSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleNameSave();
                            if (e.key === 'Escape') {
                                setName(group.name);
                                setIsEditingName(false);
                            }
                        }}
                        autoFocus
                        className="text-base font-bold h-8 text-sm"
                    />
                ) : (
                    <h3
                        onClick={() => setIsEditingName(true)}
                        className="text-base font-bold cursor-pointer hover:text-primary transition-colors flex-1 truncate"
                    >
                        {group.name}
                    </h3>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/header:opacity-100 transition-all"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Card Count Badge */}
            <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded-md">
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                </span>
            </div>

            {/* Cards Container */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto space-y-1 rounded-md p-1.5 transition-colors ${isOver ? 'bg-accent/20 ring-2 ring-accent/50 ring-inset' : 'bg-muted/20'
                    }`}
            >
                <SortableContext items={sortedCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {sortedCards.length === 0 ? (
                        <div className="flex items-center justify-center h-20 text-muted-foreground/50 text-xs">
                            <p>Drop cards here</p>
                        </div>
                    ) : (
                        sortedCards.map(card => (
                            <KanbanCard key={card.id} card={card} />
                        ))
                    )}
                </SortableContext>
            </div>

            {/* Quick Add */}
            <div className="mt-2">
                <QuickAddCard onAdd={handleQuickAdd} onCancel={() => { }} />
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Group?"
                description={`Delete "${group.name}"? All cards in this group will be removed.`}
                onConfirm={handleDelete}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
};
