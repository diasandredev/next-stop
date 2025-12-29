import { Card, ExtraColumn as ExtraColumnType } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { useKanban } from '@/contexts/KanbanContext';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface ExtraColumnProps {
  column: ExtraColumnType;
  cards: Card[];

  minSlots?: number;
}

export const ExtraColumn = ({ column, cards, minSlots = 25 }: ExtraColumnProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [isAdding, setIsAdding] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const { updateExtraColumn, addCard } = useKanban();

  const { setNodeRef, isOver } = useDroppable({
    id: `extra-${column.id}`,
    data: { type: 'extra', columnId: column.id },
  });

  const handleSave = () => {
    if (name.trim()) {
      updateExtraColumn(column.id, name.trim());
      setIsEditing(false);
    }
  };

  const handleAddCard = (keepOpen = false) => {
    if (newCardTitle.trim()) {
      addCard({
        title: newCardTitle.trim(),
        columnType: 'extra',
        extraColumnId: column.id,
        dashboardId: column.dashboardId
      });
      setNewCardTitle('');
      if (!keepOpen) {
        setIsAdding(false);
      }
    } else if (!keepOpen) {
      setIsAdding(false);
    }
  };

  const MIN_SLOTS = minSlots;

  return (
    <div className="w-full md:flex-1 min-w-0 flex flex-col overflow-hidden">
      <div className="h-12 border-b-2 border-white relative z-[1] flex-shrink-0 flex items-center px-1">
        <div className="flex items-center gap-2 w-full">
          {isEditing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="h-8 text-2xl font-bold bg-transparent border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
              autoFocus
            />
          ) : (
            <div
              className="flex items-center gap-2 cursor-pointer group w-full"
              onClick={() => setIsEditing(true)}
            >
              <h3 className="text-2xl font-bold text-muted-foreground group-hover:text-foreground transition-colors">{column.name}</h3>
              <Edit2 className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`px-1 pt-0 space-y-0 flex-1 transition-all duration-300 ease-out mx-0.5
          ${isOver ? 'bg-accent/20 ring-2 ring-accent/50 ring-inset rounded-lg' : ''}
        `}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard key={card.id} card={card} />
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

        {/* Empty slots */}
        {Array.from({ length: Math.max(0, Math.max(MIN_SLOTS, cards.length + 1) - cards.length - (isAdding ? 1 : 0)) }).map((_, i) => (
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
