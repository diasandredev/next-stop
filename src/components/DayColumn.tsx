import { Card } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { Input } from './ui/input';
import { Split } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

interface DayColumnProps {
  dashboardId: string;
  date: Date;
  cards: Card[];
  isCurrentDay: boolean;
  isWeekend?: boolean;
  minSlots: number;
  headerHeight?: string;
}

export const DayColumn = ({
  dashboardId,
  date,
  cards,
  isCurrentDay,
  isWeekend = false,
  minSlots,
  headerHeight = 'h-12'
}: DayColumnProps) => {
  const { addCard } = useKanban();
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
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
        date: dateString,
        columnType: 'day',
        order: cards.length,
        dashboardId
      });
      setNewCardTitle('');
      if (!keepOpen) {
        setIsAdding(false);
      }
    } else if (!keepOpen) {
      setIsAdding(false);
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

  const MIN_SLOTS = minSlots;

  // Filter cards
  const rootCards = cards.filter(c => !c.parentId).sort((a, b) => (a.order || 0) - (b.order || 0));
  const childCards = cards.filter(c => c.parentId);

  return (
    <div className={`${isWeekend ? 'flex-none w-full md:w-auto' : 'w-full md:flex-1'} min-w-0 flex flex-col overflow-hidden`}>
      <div className={`${headerHeight} border-b-2 ${isCurrentDay ? 'border-primary' : 'border-white'} relative z-[1] flex-shrink-0 flex items-end px-1 pb-1`}>
        <div className="flex items-center justify-between w-full">
          <div className={`text-2xl font-bold ${isCurrentDay ? 'text-primary' : 'text-white'}`}>
            {dayNumber} {monthName}
          </div>
          <div className="flex items-center gap-1">
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
          <div className="h-12 border-b border-border/40 rounded-md bg-transparent px-2 flex items-center">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard(true);
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCardTitle('');
                }
              }}
              onBlur={() => handleAddCard(false)}
              className="h-full text-sm bg-transparent border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        )}

        {/* Empty slots - Invisible but clickable */}
        {Array.from({ length: Math.max(0, Math.max(MIN_SLOTS, rootCards.length + 1) - rootCards.length - (isAdding ? 1 : 0)) }).map((_, i) => (
          <div
            key={`slot-${i}`}
            onClick={() => setIsAdding(true)}
            className="h-12 border-b border-border/40 rounded-none cursor-pointer hover:bg-accent/5 transition-colors"
          />
        ))}
      </div>
    </div>
  );
};
