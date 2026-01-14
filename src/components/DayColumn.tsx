import { Card } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { Input } from './ui/input';
import { Split, Map, MapPinned } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { EmojiPicker } from './EmojiPicker';
import { createGoogleMapsRouteUrl } from '@/utils/googleMapsUtils';
import { CustomRouteDialog } from './CustomRouteDialog';
import { getCurrencySymbol } from '@/utils/currency';
import chroma from 'chroma-js';

interface DayColumnProps {
  dashboardId: string;
  date: Date;
  cards: Card[];
  isCurrentDay: boolean;
  isWeekend?: boolean;
  minSlots: number;
  headerHeight?: string;
  dashboardColor?: string;
}

export const DayColumn = ({
  dashboardId,
  date,
  cards,
  isCurrentDay,
  isWeekend = false,
  minSlots,
  headerHeight = 'h-12',
  dashboardColor
}: DayColumnProps) => {
  const { addCard } = useKanban();
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardIcon, setNewCardIcon] = useState<string | undefined>();
  const [showCustomRouteDialog, setShowCustomRouteDialog] = useState(false);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  const dateString = date.toISOString().split('T')[0];

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dashboardId}-${dateString}`,
    data: { type: 'day', date: dateString, dashboardId },
  });

  const handleAddCard = (keepOpen = false) => {
    if (newCardTitle.trim()) {
      addCard({
        title: newCardTitle.trim(),
        icon: newCardIcon,
        date: dateString,
        columnType: 'day',
        order: cards.length,
        dashboardId
      });
      setNewCardTitle('');
      setNewCardIcon(undefined);
      if (!keepOpen) {
        setIsAdding(false);
      }
    } else if (!keepOpen) {
      setIsAdding(false);
      setNewCardIcon(undefined);
    }
  };

  const handleAddOptionsGroup = () => {
    addCard({
      title: 'Options',
      date: dateString,
      columnType: 'day',
      type: 'options',
      order: cards.length,
      dashboardId
    });
  };

  const handleCreateRoute = () => {
    // Extract locations from cards that have them
    const locationsInOrder = cards
      .filter(c => !c.parentId && c.location) // Only root cards with locations
      .sort((a, b) => (a.order || 0) - (b.order || 0)) // Sort by order
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

  // Calculate total cost
  const totalCost = cards.reduce((acc, card) => {
    if (card.cost && !card.completed) {
      const currency = card.currency || 'USD';
      acc[currency] = (acc[currency] || 0) + card.cost;
    }
    return acc;
  }, {} as Record<string, number>);

  const MIN_SLOTS = minSlots;

  // Filter cards
  const rootCards = cards.filter(c => !c.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const childCards = cards.filter(c => c.parentId);

  return (
    <div className={`${isWeekend ? 'flex-none w-full md:w-auto' : 'w-full md:flex-1'} min-w-0 flex flex-col overflow-hidden`}>
      <div className={`${headerHeight} border-b-2 ${isCurrentDay ? 'border-primary' : 'border-white'} relative z-[1] flex-shrink-0 flex items-end px-1 pb-1 group/header`}>
        <div className="flex items-center justify-between w-full">
          <div className={`text-2xl font-bold ${isCurrentDay ? 'text-primary' : 'text-white'}`}>
            {dayNumber} {monthName}
          </div>
          <div className="flex items-center gap-1">
            {/* Daily Total Cost Display - Hover only */}
            {Object.keys(totalCost).length > 0 && (
               <div 
                  className={`hidden sm:flex items-baseline gap-2 mr-1 px-2 py-0.5 rounded-md ${!dashboardColor || dashboardColor === 'transparent' ? 'bg-white/5 border border-white/5' : ''} opacity-0 -translate-x-2 group-hover/header:opacity-100 group-hover/header:translate-x-0 transition-all duration-300 ease-out`}
                  style={dashboardColor && dashboardColor !== 'transparent' ? {
                      backgroundColor: chroma(dashboardColor).alpha(0.5).css(),
                      color: chroma(dashboardColor).luminance() > 0.5 ? '#1a1a1a' : '#ffffff'
                  } : undefined}
               >
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Total</span>
                  <div className="flex gap-2">
                    {Object.entries(totalCost).map(([curr, amount]) => (
                        <div key={curr} className="flex items-baseline gap-1">
                             <span className="text-[11px] font-bold text-white">{getCurrencySymbol(curr)}</span>
                             <span className="text-[12px] font-bold text-white font-mono">
                                {new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}
                             </span>
                        </div>
                    ))}
                  </div>
               </div>
            )}

            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={handleCreateRoute}
                    disabled={!cards.some(c => !c.parentId && c.location)}
                  >
                    <Map className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {cards.some(c => !c.parentId && c.location)
                    ? 'Create Route in Google Maps'
                    : 'No locations to route'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={() => setShowCustomRouteDialog(true)}
                    disabled={!cards.some(c => !c.parentId && c.location)}
                  >
                    <MapPinned className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {cards.some(c => !c.parentId && c.location)
                    ? 'Create Custom Route'
                    : 'No locations to route'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={handleAddOptionsGroup}>
                    <Split className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Itinerary Options</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className={`text-base capitalize ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>{dayName}</div>
          </div>
        </div>
        
        {/* Daily Total Cost Display - Removed absolute positioning */}


      </div>
      <div
        ref={setNodeRef}
        className={`px-1 pt-0 space-y-0 flex-1 transition-all duration-300 ease-out mx-0.5
          ${isOver ? 'bg-accent/20 ring-2 ring-accent/50 ring-inset rounded-lg' : ''}
        `}
      >
        <SortableContext items={rootCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {rootCards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              childrenCards={childCards.filter(c => c.parentId === card.id)}
            />
          ))}
        </SortableContext>

        {isAdding && (
          <div className="h-12 border-b border-border/40 rounded-md bg-transparent px-1 flex items-center gap-1">
            <EmojiPicker
              value={newCardIcon}
              onChange={setNewCardIcon}
              triggerClassName="h-6 w-6 shrink-0"
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
              onBlur={() => handleAddCard(false)}
              className="h-full text-sm bg-transparent border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground flex-1"
              autoFocus
            />
          </div>
        )}

        {/* Empty slots - Invisible but clickable */}
        {(() => {
          // Calculate used slots based on visual height
          let usedSlots = 0;
          rootCards.forEach(card => {
            if (card.type === 'options') {
              const children = childCards.filter(c => c.parentId === card.id);
              const count1 = children.filter(c => c.optionId === '1').length;
              const count2 = children.filter(c => c.optionId === '2').length;
              // 1 slot (Header) + max children. 
              // If empty, max(0,0)=0, so just 1 slot for header.
              // Note: Visual counting must match DashboardView logic
              usedSlots += 1 + Math.max(count1, count2);
            } else {
              usedSlots += 1;
            }
          });

          if (isAdding) usedSlots += 1;

          const slotsToRender = Math.max(0, MIN_SLOTS - usedSlots);

          return Array.from({ length: slotsToRender }).map((_, i) => (
            <div
              key={`slot-${i}`}
              onClick={() => setIsAdding(true)}
              className="h-12 border-b border-border/40 rounded-none cursor-pointer hover:bg-accent/5 transition-colors"
            />
          ));
        })()}
      </div>

      <CustomRouteDialog
        open={showCustomRouteDialog}
        onOpenChange={setShowCustomRouteDialog}
        cards={cards}
        dayDate={dateString}
      />
    </div>
  );
};
