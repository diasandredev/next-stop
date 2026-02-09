import { Card as CardType } from '@/types/kanban';
import chroma from 'chroma-js';
import { MapPin, CheckSquare, GripVertical, Clock, DollarSign } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { EditCardDialog } from './EditCardDialog';
import { useKanban } from '@/contexts/KanbanContext';
import { OptionsCard } from './OptionsCard';
import { getCurrencySymbol } from '@/utils/currency';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface KanbanCardProps {
  card: CardType;
  childrenCards?: CardType[];
  isNested?: boolean;
  className?: string;
}

export const KanbanCard = ({ card, childrenCards = [], isNested = false, className = '' }: KanbanCardProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const { updateCard } = useKanban();
  const { theme } = useTheme();

  const handleSaveTitle = () => {
      if (editTitle.trim() && editTitle !== card.title) {
          updateCard(card.id, { title: editTitle.trim() });
      }
      setIsEditing(false);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: card.type || 'card',
      card
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms ease',
  };

  if (card.type === 'options') {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
        <OptionsCard card={card} childCards={childrenCards} />
      </div>
    );
  }

  // Card Color Logic
  const hasColor = card.color && card.color !== 'transparent';
  
  // Dynamic default styles based on theme
  const isDark = theme === 'dark' || theme === 'system'; // simplistic check, ideally check system pref
  
  const defaultBg = 'var(--card-muted, hsl(0 0% 98%))';
  const defaultBorder = 'var(--border)';
  
  const bgColor = hasColor 
    ? chroma(card.color!).alpha(0.15).css() 
    : (theme === 'light' ? 'hsl(0 0% 100%)' : 'rgba(255, 255, 255, 0.03)');
    
  const borderColor = hasColor 
    ? chroma(card.color!).alpha(0.3).css() 
    : (theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255, 255, 255, 0.08)');
    
  const hoverBorderColor = hasColor 
    ? chroma(card.color!).alpha(0.5).css() 
    : (theme === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(255, 255, 255, 0.2)');

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowEditDialog(true)}
        className={cn(
            "group relative w-full mb-2 touch-none select-none outline-none",
            isDragging ? "z-50 opacity-0" : "z-0",
            className
        )}
      >
          <div 
            className={cn(
                "relative w-full rounded-xl border transition-all duration-200 ease-out overflow-hidden flex flex-col gap-1.5",
                isNested ? "p-2 min-h-[3rem]" : "p-3 min-h-[4rem]",
                "hover:shadow-lg hover:-translate-y-0.5"
            )}
            style={{ 
                backgroundColor: bgColor,
                borderColor: isDragging ? 'var(--primary)' : borderColor,
                boxShadow: isDragging ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none'
            }}
          >
              {/* Left Stripe for completion status or category color */}
              {hasColor && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1 opacity-60" 
                    style={{ backgroundColor: card.color }} 
                  />
              )}

              {/* Header: Title and Checkbox */}
              <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                             {card.icon && (
                                <span className="text-base leading-none">{card.icon}</span>
                             )}
                             
                             {isEditing ? (
                                <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveTitle();
                                            e.currentTarget.blur();
                                        }
                                        if (e.key === 'Escape') {
                                            setEditTitle(card.title);
                                            setIsEditing(false);
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="h-6 p-0 bg-transparent border-none text-foreground text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 px-1 -ml-1 w-full"
                                />
                             ) : (
                                <span 
                                    className={cn(
                                        "font-medium text-sm text-foreground/90 truncate leading-snug cursor-text"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                >
                                    {card.title}
                                </span>
                             )}
                        </div>

                        {/* Metadata Row */}
                        {(card.time || card.location || card.cost !== undefined || (card.checklist && card.checklist.length > 0)) && (
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                                {card.time && (
                                    <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-[4px]">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{card.time}</span>
                                    </div>
                                )}
                                
                                {card.location && (
                                    <div className="flex items-center gap-1 max-w-[100px] truncate">
                                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                                        <span className="truncate">{card.location.name}</span>
                                    </div>
                                )}

                                {card.cost !== undefined && (
                                    <div className="flex items-center gap-0.5">
                                        <span className="font-mono text-foreground/70">
                                            {getCurrencySymbol(card.currency)}
                                            {card.cost.toFixed(0)}
                                        </span>
                                    </div>
                                )}

                                {card.checklist && card.checklist.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <CheckSquare className="w-2.5 h-2.5" />
                                        <span>
                                            {card.checklist.filter(i => i.completed).length}/{card.checklist.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                  </div>
                  
                  {/* Drag Handle - Visible on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-white/5 rounded">
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                  </div>
              </div>
          </div>
      </div>

      <EditCardDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        card={card}
      />
    </>
  );
};
