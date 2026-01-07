import { Card as CardType } from '@/types/kanban';

import { Check, Circle, MapPin } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { EditCardDialog } from './EditCardDialog';
import { useKanban } from '@/contexts/KanbanContext';
import { OptionsCard } from './OptionsCard';

interface KanbanCardProps {
  card: CardType;
  childrenCards?: CardType[];
  isNested?: boolean;
  className?: string;
}

export const KanbanCard = ({ card, childrenCards = [], isNested = false, className = '' }: KanbanCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { updateCard } = useKanban();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: card.completed,
    data: {
      type: card.type || 'card',
      card
    }
  });

  const customStyle = (card.color && card.color !== 'transparent') ? { backgroundColor: card.color } : {};

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !card.completed;
    updateCard(card.id, {
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : undefined
    });
  };

  if (card.type === 'options') {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
        <OptionsCard card={card} childCards={childrenCards} />
      </div>
    );
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowEditDialog(true)}
        className={`
          group cursor-grab relative
          ${isDragging ? 'invisible' : 'z-0'}
          ${isNested ? 'h-12 text-sm' : 'h-12'} 
          border-b border-border/40 hover:border-[#5a8fc4] flex items-center justify-between pr-2
          transition-colors duration-200
          ${card.completed ? 'opacity-60' : ''}
          ${isNested ? 'bg-black/20' : ''}
          ${className}
        `}
      >
        <div
          style={customStyle}
          className={`
            inline-flex items-center gap-2 ${isNested ? 'px-2 py-0.5' : 'px-3 py-1'} rounded-full text-white font-medium shadow-sm
            transition-all duration-200 ease-out
            hover:scale-105 hover:shadow-md w-fit
            ${card.completed ? 'opacity-50' : ''}
            ${isNested ? 'text-sm' : 'text-sm'}
          `}
        >

          {card.icon && (
            <span className={`mr-1 ${isNested ? 'text-sm' : 'text-base'}`}>
              {card.icon}
            </span>
          )}
          {card.time && (
            <span className={`text-white/80 font-normal mr-1 ${isNested ? 'text-[10px]' : 'text-xs'}`}>
              {card.time}
            </span>
          )}
          <span className={`truncate ${card.columnType === 'extra' ? 'max-w-[300px]' : (isNested ? 'max-w-[120px]' : 'max-w-[200px]')} ${card.completed ? 'line-through text-white/70' : ''}`}>
            {card.title}
          </span>
          {card.location && (
            <MapPin className="w-3 h-3 text-white/70 ml-1.5 shrink-0" />
          )}
        </div>

        {/* Completion Button - Only for day columns */}
        {card.columnType !== 'extra' && (
          <button
            onClick={handleToggleComplete}
            className={`
              p-1 rounded-full transition-all duration-200
              ${card.completed
                ? 'text-muted-foreground hover:text-white opacity-100'
                : 'text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100'
              }
            `}
          >
            {card.completed ? (
              <div className="bg-white rounded-full p-0.5">
                <Check className={`text-black ${isNested ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} strokeWidth={4} />
              </div>
            ) : (
              <Circle className={isNested ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            )}
          </button>
        )}
      </div>

      <EditCardDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        card={card}
      />
    </>
  );
};
