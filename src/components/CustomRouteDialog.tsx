import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/types/kanban';
import { MapPin, Check, Square, CheckSquare, GripVertical } from 'lucide-react';
import { createGoogleMapsRouteUrl } from '@/utils/googleMapsUtils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CustomRouteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cards: Card[];
    dayDate: string;
}

interface SortableCardItemProps {
    card: Card;
    isSelected: boolean;
    onToggle: () => void;
}

const SortableCardItem = ({ card, isSelected, onToggle }: SortableCardItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: card.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
        className={`
        flex items-center gap-3 p-3 rounded-lg transition-all
        ${isSelected
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }
      `}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing shrink-0 text-muted-foreground hover:text-white"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="shrink-0 cursor-pointer" onClick={onToggle}>
                {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                    <Square className="w-5 h-5 text-white/30" />
                )}
            </div>

            <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-2">
                    {card.icon && (
                        <span className="text-base">{card.icon}</span>
                    )}
                    {card.time && (
                        <span className="text-xs text-white/60">{card.time}</span>
                    )}
                    <span className="text-sm font-medium truncate">{card.title}</span>
                </div>
                {card.location && (
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-muted-foreground truncate">
                            {card.location.name}
                        </span>
                    </div>
                )}
            </div>

            {isSelected && (
                <Check className="w-4 h-4 text-primary shrink-0" />
            )}
        </div>
    );
};

export const CustomRouteDialog = ({ open, onOpenChange, cards, dayDate }: CustomRouteDialogProps) => {
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
    const [orderedCards, setOrderedCards] = useState<Card[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize ordered cards when dialog opens or cards change
    useEffect(() => {
        const cardsWithLocations = cards
            .filter(c => !c.parentId && c.location)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        setOrderedCards(cardsWithLocations);
    }, [cards, open]);

    // Clear selections when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedCardIds(new Set());
        }
    }, [open]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setOrderedCards((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleToggleCard = (cardId: string) => {
        const newSelected = new Set(selectedCardIds);
        if (newSelected.has(cardId)) {
            newSelected.delete(cardId);
        } else {
            newSelected.add(cardId);
        }
        setSelectedCardIds(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedCardIds(new Set(orderedCards.map(c => c.id)));
    };

    const handleDeselectAll = () => {
        setSelectedCardIds(new Set());
    };

    const handleCreateRoute = () => {
        // Use the custom order from orderedCards
        const selectedCards = orderedCards.filter(c => selectedCardIds.has(c.id));
        const locations = selectedCards.map(c => ({
            lat: c.location!.lat,
            lng: c.location!.lng,
            placeId: c.location!.placeId
        }));

        const routeUrl = createGoogleMapsRouteUrl(locations);
        if (routeUrl) {
            window.open(routeUrl, '_blank');
            onOpenChange(false);
        }
    };

    const formattedDate = new Date(dayDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold">Create Custom Route</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Select and reorder locations for your route on {formattedDate}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Action buttons */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {selectedCardIds.size} of {orderedCards.length} selected
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={selectedCardIds.size === orderedCards.length}
                                className="text-xs h-7"
                            >
                                Select All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeselectAll}
                                disabled={selectedCardIds.size === 0}
                                className="text-xs h-7"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Cards list with drag and drop */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={orderedCards.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {orderedCards.map((card) => (
                                    <SortableCardItem
                                        key={card.id}
                                        card={card}
                                        isSelected={selectedCardIds.has(card.id)}
                                        onToggle={() => handleToggleCard(card.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Create route button */}
                    <div className="pt-4 border-t border-white/10">
                        <Button
                            onClick={handleCreateRoute}
                            disabled={selectedCardIds.size === 0}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
                        >
                            Create Route ({selectedCardIds.size} location{selectedCardIds.size !== 1 ? 's' : ''})
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
