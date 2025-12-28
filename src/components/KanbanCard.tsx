import { Card as CardType } from '@/types/kanban';

import { Check, Circle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { EditCardDialog } from './EditCardDialog';
import { useKanban } from '@/contexts/KanbanContext';

interface KanbanCardProps {
  card: CardType;
}

export const KanbanCard = ({ card }: KanbanCardProps) => {
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
    disabled: card.completed
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
          h-12 border-b border-border/40 hover:border-blue-500 flex items-center justify-between pr-2
          transition-colors duration-200
          ${card.completed ? 'opacity-60' : ''}
        `}
      >
        <div
          style={customStyle}
          className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium shadow-sm
            transition-all duration-200 ease-out
            hover:scale-105 hover:shadow-md w-fit
            ${card.completed ? 'opacity-50' : ''}
          `}
        >

          {card.time && (
            <span className="text-xs text-white/80 font-normal mr-1">
              {card.time}
            </span>
          )}
          <span className={`truncate ${card.columnType === 'extra' ? 'max-w-[300px]' : 'max-w-[200px]'} ${card.completed ? 'line-through text-white/70' : ''}`}>
            {card.title}
          </span>
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
                <Check className="w-3 h-3 text-black" strokeWidth={4} />
              </div>
            ) : (
              <Circle className="w-4 h-4" />
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
