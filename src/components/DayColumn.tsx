import { Card } from '@/types/kanban';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, Map, MapPinned, Split } from 'lucide-react';
import { useKanban } from '@/contexts/KanbanContext';
import { useState } from 'react';
import { Input } from './ui/input';
import { EmojiPicker } from './EmojiPicker';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { createGoogleMapsRouteUrl } from '@/utils/googleMapsUtils';
import { CustomRouteDialog } from './CustomRouteDialog';

export interface DayColumnProps {
    dashboardId: string;
    date: Date;
    dayIndex?: number;
    cards: Card[];
    isCurrentDay: boolean;
    minSlots: number;
    isWeekend?: boolean;
    dashboardColor?: string;
    searchQuery?: string;
    accommodation?: {
        name: string;
        lat: number;
        lng: number;
        placeId: string;
    };
}

export const DayColumn = ({
    dashboardId,
    date,
    dayIndex,
    cards,
    isCurrentDay,
    minSlots,
    isWeekend = false,
    dashboardColor = '#3b82f6',
    searchQuery = '',
    accommodation
}: DayColumnProps) => {
    const dateStr = date.toISOString().split('T')[0];
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${dashboardId}-${dateStr}`,
        data: {
            type: 'day',
            date: dateStr,
            dashboardId
        }
    });

    const { addCard } = useKanban();
    const [isAdding, setIsAdding] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [newCardIcon, setNewCardIcon] = useState<string | undefined>();
    const [showCustomRouteDialog, setShowCustomRouteDialog] = useState(false);

    const handleCreateRoute = () => {
        const locationsInOrder = cards
            .filter(c => !c.parentId && c.location)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(c => ({
                lat: c.location!.lat,
                lng: c.location!.lng,
                placeId: c.location!.placeId
            }));

        const routeUrl = createGoogleMapsRouteUrl(locationsInOrder);
        if (routeUrl) {
            window.open(routeUrl, '_blank');
        }
    };

    const handleAddCard = (keepOpen = false) => {
        if (newCardTitle.trim()) {
            addCard({
                title: newCardTitle.trim(),
                icon: newCardIcon,
                date: dateStr,
                columnType: 'day',
                order: cards.length,
                dashboardId,
                completed: false,
                type: 'default'
            });
            setNewCardTitle('');
            setNewCardIcon(undefined);
            if (!keepOpen) setIsAdding(false);
        } else if (!keepOpen) {
            setIsAdding(false);
            setNewCardIcon(undefined);
        }
    };

    const handleAddOptionsGroup = () => {
        addCard({
            title: 'Options',
            date: dateStr,
            columnType: 'day',
            type: 'options',
            order: cards.length,
            dashboardId
        });
    };

    // Filter cards based on search query
    const filteredCards = searchQuery
        ? cards.filter(card => {
            const q = searchQuery.toLowerCase();
            return (
                card.title.toLowerCase().includes(q) ||
                card.location?.name?.toLowerCase().includes(q) ||
                card.notes?.toLowerCase().includes(q) ||
                card.checklist?.some(item => item.text.toLowerCase().includes(q))
            );
        })
        : cards;

    const rootCards = filteredCards.filter(c => !c.parentId);
    const sortedRootCards = rootCards.sort((a, b) => (a.order || 0) - (b.order || 0));

    // We need all cards for passing children to parents
    const allCards = cards;

    // Header Color Logic
    const borderClass = isCurrentDay ? 'border-primary shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]' : 'border-border';
    const bgClass = isCurrentDay
        ? 'bg-primary/5'
        : (isWeekend ? 'bg-muted/50 dark:bg-black/20' : 'bg-card/30 dark:bg-[#09090b]/20');

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "h-full flex flex-col rounded-2xl transition-all duration-300 group/column relative",
                borderClass,
                "border backdrop-blur-sm",
                bgClass
            )}
            style={isOver ? {
                boxShadow: `0 0 0 2px ${dashboardColor}`,
                backgroundColor: 'rgba(255,255,255,0.02)'
            } : undefined}
        >
            {/* "Passport" Header */}
            <div
                className={cn(
                    "relative p-3 border-b border-border flex flex-col gap-1 transition-colors",
                    isCurrentDay && "bg-primary text-primary-foreground"
                )}
            >
                {/* Day Number Watermark - Removed */}

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                        <span className={cn(
                            "text-xs font-mono uppercase tracking-widest opacity-70",
                            isCurrentDay ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                            {format(date, 'EEEE')}
                        </span>
                        <span className={cn(
                            "text-2xl font-display font-bold tracking-tight",
                            isCurrentDay ? "text-primary-foreground" : "text-foreground"
                        )}>
                            {format(date, 'MMM d')}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 md:gap-1">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleCreateRoute}
                                        disabled={!cards.some(c => !c.parentId && c.location)}
                                        className={cn(
                                            "w-8 h-8 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 touch-manipulation",
                                            isCurrentDay
                                                ? "bg-white/20 hover:bg-white/30 text-white"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Map className="w-4 h-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Open Route in Google Maps</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setShowCustomRouteDialog(true)}
                                        disabled={!cards.some(c => !c.parentId && c.location) && !accommodation}
                                        className={cn(
                                            "w-8 h-8 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-30 touch-manipulation",
                                            isCurrentDay
                                                ? "bg-white/20 hover:bg-white/30 text-white"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <MapPinned className="w-4 h-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Create Custom Route in Google Maps</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleAddOptionsGroup}
                                        className={cn(
                                            "w-8 h-8 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-all touch-manipulation",
                                            isCurrentDay
                                                ? "bg-white/20 hover:bg-white/30 text-white"
                                                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Split className="w-4 h-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Add Itinerary Options</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <button
                            onClick={() => setIsAdding(true)}
                            className={cn(
                                "w-8 h-8 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-all touch-manipulation",
                                isCurrentDay
                                    ? "bg-white/20 hover:bg-white/30 text-white"
                                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Visual Accent Bar */}
                {!isCurrentDay && (
                    <div
                        className="absolute bottom-0 left-0 w-full h-[2px] opacity-0 group-hover/column:opacity-100 transition-opacity duration-500"
                        style={{ background: `linear-gradient(90deg, transparent, ${dashboardColor}, transparent)` }}
                    />
                )}
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar space-y-2">
                <SortableContext
                    items={sortedRootCards.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {sortedRootCards.map((card) => {
                        // Pass children if any (for Options type)
                        const children = card.type === 'options'
                            ? allCards.filter(c => c.parentId === card.id)
                            : undefined;

                        return (
                            <KanbanCard
                                key={card.id}
                                card={card}
                                childrenCards={children}
                            />
                        );
                    })}
                </SortableContext>

                {/* Inline Add Card Input */}
                {isAdding && (
                    <div className="bg-muted rounded-xl p-2 animate-fade-in">
                        <div className="flex items-center gap-2">
                            <EmojiPicker
                                value={newCardIcon}
                                onChange={setNewCardIcon}
                                triggerClassName="h-8 w-8 shrink-0 hover:bg-background/50 rounded-lg text-foreground"
                            />
                            <Input
                                value={newCardTitle}
                                onChange={(e) => setNewCardTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddCard(true);
                                    if (e.key === 'Escape') {
                                        setIsAdding(false);
                                        setNewCardTitle('');
                                        setNewCardIcon(undefined);
                                    }
                                }}
                                onBlur={() => {
                                    // Small delay to allow emoji picker click to register if needed
                                    // But for now, just save on blur is standard
                                    handleAddCard(false);
                                }}
                                placeholder="What's the plan?"
                                autoFocus
                                className="h-8 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-none"
                            />
                        </div>
                    </div>
                )}

                {/* Empty State / Drop Target Area - Only when NO cards exist */}
                {sortedRootCards.length === 0 && !isAdding && (
                    <div
                        onClick={() => setIsAdding(true)}
                        className={cn(
                            "flex flex-col items-center justify-center h-[76px] text-muted-foreground/20 border-2 border-dashed rounded-xl transition-all cursor-pointer group/empty",
                            !isOver && "hover:border-border hover:bg-muted/50"
                        )}
                        style={{ borderColor: `${dashboardColor}30` }}
                    >
                        <span className="text-xs font-medium uppercase tracking-widest group-hover/empty:text-muted-foreground/50 transition-colors">Plan this day</span>
                    </div>
                )}
            </div>

            <CustomRouteDialog
                open={showCustomRouteDialog}
                onOpenChange={setShowCustomRouteDialog}
                cards={cards}
                dayDate={dateStr}
                accommodation={accommodation}
            />
        </div>
    );
};
