import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, ChecklistItem } from '@/types/kanban';
import { useKanban } from '@/contexts/KanbanContext';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar, Trash2, MoreHorizontal, Circle, CheckSquare, Plus, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LocationSearch } from './LocationSearch';
import { MapPin, Map } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ColorPicker } from './ColorPicker';
import { TimePicker } from './TimePicker';
import { EmojiPicker } from './EmojiPicker';
import { createGoogleMapsLocationUrl } from '@/utils/googleMapsUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from 'lucide-react';

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
}

export const EditCardDialog = ({ open, onOpenChange, card }: EditCardDialogProps) => {
  const { updateCard, deleteCard } = useKanban();
  const [title, setTitle] = useState(card.title);
  const [icon, setIcon] = useState(card.icon);
  const [description, setDescription] = useState(card.description || '');
  const [color, setColor] = useState(card.color || 'transparent');
  const [time, setTime] = useState(card.time || '');
  const [cost, setCost] = useState(card.cost !== undefined ? card.cost.toFixed(2) : '');
  const [currency, setCurrency] = useState(card.currency || 'USD');
  const [location, setLocation] = useState(card.location);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Ref to track if we need to save on close
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setIcon(card.icon);
      setDescription(card.description || '');
      setColor(card.color || 'transparent');
      setTime(card.time || '');
      setCost(card.cost !== undefined ? card.cost.toFixed(2) : '');
      setCurrency(card.currency || 'USD');
      setLocation(card.location);
      setChecklist(card.checklist || []);
      dirtyRef.current = false;
    }
  }, [card, open]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && dirtyRef.current) {
      const updates: Partial<Card> = {
        title,
        icon,
        description,
        color,
        time,
        cost: cost ? parseFloat(cost) : undefined,
        currency,
        location,
        checklist,
      };
      updateCard(card.id, updates);
      onOpenChange(isOpen);
    } else {
      onOpenChange(isOpen);
    }
  };

  const handleDelete = () => {
    deleteCard(card.id);
    onOpenChange(false);
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    dirtyRef.current = true;
  };

  const handleLocationSelect = (newLocation: NonNullable<Card['location']>) => {
    setLocation(newLocation);
    dirtyRef.current = true;
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem.trim(),
      completed: false
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistItem('');
    dirtyRef.current = true;
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
    dirtyRef.current = true;
  };

  const deleteChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId));
    dirtyRef.current = true;
  };

  const handleDiscardChanges = () => {
    dirtyRef.current = false;
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
  };

  const handleOpenInMaps = () => {
    if (location) {
      const mapsUrl = createGoogleMapsLocationUrl(location);
      window.open(mapsUrl, '_blank');
    }
  };

  const dateString = card.date ? new Date(card.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'No date';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[600px] p-0 gap-0 rounded-2xl shadow-2xl overflow-hidden">
        <DialogTitle className="sr-only">Edit Card</DialogTitle>
        <DialogDescription className="sr-only">Edit the details of your card</DialogDescription>
        
        <TooltipProvider>
            {/* Header / Actions Bar - Clean and Minimal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{dateString}</span>
                 </div>

                <div className="flex items-center gap-1">
                    {/* Color Picker */}
                    <Popover>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-8 w-8">
                                        <Circle
                                            className="w-4 h-4"
                                            style={{
                                                fill: color === 'transparent' ? 'transparent' : color,
                                                color: color === 'transparent' ? 'currentColor' : color
                                            }}
                                        />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent><p>Color</p></TooltipContent>
                        </Tooltip>
                        <PopoverContent align="end" className="w-auto p-3 bg-[#2a2a2a] border-white/10">
                            <ColorPicker color={color} onChange={handleColorChange} />
                        </PopoverContent>
                    </Popover>

                    {/* Delete */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full h-8 w-8" onClick={handleDelete}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>

                    {/* More Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#2a2a2a] border-white/10 text-white">
                            <DropdownMenuItem onClick={handleDiscardChanges} className="text-red-400 focus:text-red-400 focus:bg-white/10 cursor-pointer">
                                Discard changes
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
                {/* 1. Hero Section: Icon & Title */}
                <div className="flex items-center gap-5">
                    <div>
                        <EmojiPicker
                            value={icon}
                            onChange={(newIcon) => {
                                setIcon(newIcon);
                                dirtyRef.current = true;
                            }}
                            triggerClassName="h-14 w-14 rounded-full text-4xl"
                        />
                    </div>
                    <Input
                        autoFocus
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            dirtyRef.current = true;
                        }}
                        className="font-bold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/50 h-auto flex-1 text-3xl md:text-3xl leading-tight"
                        placeholder="Task title"
                    />
                </div>

                {/* 2. Properties Grid - Fixed Layout to prevent shifts */}
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    {/* Time Column */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">Time</Label>
                        <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10 px-2 h-10">
                            <TimePicker
                                time={time}
                                onChange={(newTime) => {
                                    setTime(newTime);
                                    dirtyRef.current = true;
                                }}
                                className="w-full bg-transparent border-none p-0 h-full text-sm focus:ring-0 hover:bg-transparent hover:pl-0 hover:pr-0 text-white transition-none"
                            />
                        </div>
                    </div>

                    {/* Cost Column */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">Cost</Label>
                        <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/10 px-3 h-10 gap-2 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                             <div className="shrink-0 text-muted-foreground">
                                <Select value={currency} onValueChange={(v) => { setCurrency(v); dirtyRef.current = true; }}>
                                    <SelectTrigger className="w-auto h-auto p-0 border-none bg-transparent text-xs font-medium gap-1 text-muted-foreground hover:text-white focus:ring-0">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#252525] border-white/10 text-white min-w-[80px]">
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="BRL">BRL</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                             <div className="w-px h-4 bg-white/10" />
                             <input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => { setCost(e.target.value); dirtyRef.current = true; }}
                                onBlur={() => {
                                    if (cost) {
                                        const num = parseFloat(cost);
                                        if (!isNaN(num)) {
                                            setCost(num.toFixed(2));
                                        }
                                    }
                                }}
                                className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-muted-foreground/30 text-white"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Location Section */}
                <div className="space-y-2">
                     <Label className="text-xs font-medium text-muted-foreground ml-1">Location</Label>
                     {location ? (
                        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{location.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={handleOpenInMaps}
                                        >
                                            <Map className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Open in Maps</p></TooltipContent>
                                </Tooltip>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                        setLocation(undefined);
                                        dirtyRef.current = true;
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <LocationSearch onLocationSelect={handleLocationSelect} defaultValue={location?.name} />
                    )}
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* 4. Checklist Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckSquare className="w-4 h-4" />
                            <span className="text-sm font-medium">Checklist</span>
                        </div>
                        <span className="text-xs text-muted-foreground/50">
                            {checklist.filter(i => i.completed).length}/{checklist.length}
                        </span>
                    </div>
                  
                  <div className="space-y-2 pl-1">
                     {checklist.map(item => (
                        <div key={item.id} className="flex items-center gap-3 group">
                           <button 
                             onClick={() => toggleChecklistItem(item.id)}
                             className={`flex-shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${item.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-white/20 hover:border-white/40'}`}
                           >
                              {item.completed && <CheckSquare className="w-3 h-3" />}
                           </button>
                           <span className={`flex-1 text-sm transition-all ${item.completed ? 'text-muted-foreground line-through decoration-white/20' : 'text-white'}`}>
                              {item.text}
                           </span>
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteChecklistItem(item.id)}
                              className="h-6 w-6 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X className="w-3.5 h-3.5" />
                           </Button>
                        </div>
                     ))}
                     
                     <div className="flex items-center gap-3 group">
                        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                           value={newChecklistItem}
                           onChange={(e) => setNewChecklistItem(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                 e.preventDefault();
                                 addChecklistItem();
                              }
                           }}
                           placeholder="Add item"
                           className="h-8 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/40 text-sm shadow-none"
                        />
                     </div>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                {/* 5. Notes Section */}
                <div className="space-y-2">
                     <Label className="text-xs font-medium text-muted-foreground ml-1">Notes</Label>
                     <Textarea
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            dirtyRef.current = true;
                        }}
                        className="bg-white/5 border-none resize-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 p-4 min-h-[100px] text-sm text-muted-foreground focus:text-white transition-colors rounded-xl shadow-none"
                        placeholder="Add details, reservation numbers, or thoughts..."
                    />
                </div>

                {/* Footer / Meta */}
                {(card.createdBy || card.lastEditedBy) && (
                    <div className="pt-2 flex flex-col gap-1">
                        {card.createdBy && (
                            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                                Created by <span className="text-white ml-1">{card.createdBy}</span>
                            </p>
                        )}
                         {card.lastEditedBy && card.lastEditedBy !== card.createdBy && (
                            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                                Edited by <span className="text-white ml-1">{card.lastEditedBy}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
