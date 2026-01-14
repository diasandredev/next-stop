import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/types/kanban';
import { useKanban } from '@/contexts/KanbanContext';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2, MoreHorizontal, Circle } from 'lucide-react';
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
  const [cost, setCost] = useState(card.cost?.toString() || '');
  const [currency, setCurrency] = useState(card.currency || 'USD');
  const [location, setLocation] = useState(card.location);

  // Ref to track if we need to save on close
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setIcon(card.icon);
      setDescription(card.description || '');
      setColor(card.color || 'transparent');
      setTime(card.time || '');
      setCost(card.cost?.toString() || '');
      setCurrency(card.currency || 'USD');
      setLocation(card.location);
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

  const handleLocationSelect = (newLocation: any) => {
    setLocation(newLocation);
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
      <DialogContent hideCloseButton className="bg-[#1a1a1a] border-none text-white sm:max-w-[600px] p-6 rounded-2xl shadow-2xl">
        <DialogTitle className="sr-only">Edit Card</DialogTitle>
        <DialogDescription className="sr-only">Edit the details of your card</DialogDescription>
        <TooltipProvider>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="sr-only">Edit Card</DialogTitle>
            <DialogDescription className="sr-only">Make changes to your card details here.</DialogDescription>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{dateString}</span>

              <div className="w-px h-4 bg-white/10 mx-2" />

              <TimePicker
                time={time}
                onChange={(newTime) => {
                  setTime(newTime);
                  dirtyRef.current = true;
                }}
                className="px-1 w-auto"
              />

              <div className="w-px h-4 bg-white/10 mx-2" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="justify-start text-left font-medium p-2 text-base h-auto hover:bg-white/5 hover:text-white transition-all duration-200 hover:pl-4 hover:pr-4 focus:outline-none text-muted-foreground px-1 w-auto"
                  >
                    <DollarSign className="mr-2 h-4 w-4 opacity-50" />
                    {cost ? (
                      <span>{currency} {cost}</span>
                    ) : (
                      <span>--</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-[#1a1a1a] border-white/10 shadow-2xl rounded-xl text-white" align="start">
                  <div className="flex gap-2">
                     <Select value={currency} onValueChange={(v) => { setCurrency(v); dirtyRef.current = true; }}>
                        <SelectTrigger className="w-[80px] h-9 text-sm bg-[#252525] border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#252525] border-white/10 text-white">
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="BRL">BRL</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                     </Select>
                     <Input
                        type="number"
                        value={cost}
                        onChange={(e) => { setCost(e.target.value); dirtyRef.current = true; }}
                        className="h-9 w-[100px] text-sm bg-[#252525] border-white/10 focus-visible:ring-0"
                        placeholder="0.00"
                     />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>

              {/* Color Picker Popover */}
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <Circle
                          className="w-3 h-3"
                          style={{
                            fill: color === 'transparent' ? 'transparent' : color,
                            color: color === 'transparent' ? 'white' : color
                          }}
                        />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Color</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent align="end" className="w-auto p-3 bg-[#2a2a2a] border-white/10">
                  <ColorPicker
                    color={color}
                    onChange={handleColorChange}
                  />
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full">
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
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <EmojiPicker
                value={icon}
                onChange={(newIcon) => {
                  setIcon(newIcon);
                  dirtyRef.current = true;
                }}
              />
              <Input
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  dirtyRef.current = true;
                }}
                className="font-bold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/50 h-auto flex-1"
                style={{ fontSize: '1.5rem' }}
                placeholder="Task title"
              />
            </div>

            <div className="flex flex-col gap-2">
              {location ? (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-md group">
                  <MapPin className="w-4 h-4 text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{location.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleOpenInMaps}
                      >
                        <Map className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open in Google Maps</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setLocation(undefined);
                      dirtyRef.current = true;
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <LocationSearch onLocationSelect={handleLocationSelect} defaultValue={location?.name} />
              )}
            </div>

            <div className="border-t border-white/5 pt-4">
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  dirtyRef.current = true;
                }}
                className="bg-transparent border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[100px] text-xl text-muted-foreground"
                placeholder="Add some extra notes here..."
              />
            </div>

            {/* Authorship Footer */}
            {(card.createdBy || card.lastEditedBy) && (
              <div className="border-t border-white/5 pt-3 text-xs text-muted-foreground/70 space-y-1">
                {card.createdBy && (
                  <p>Criado por <span className="text-muted-foreground">{card.createdBy}</span></p>
                )}
                {card.lastEditedBy && card.lastEditedBy !== card.createdBy && (
                  <p>
                    Última edição por <span className="text-muted-foreground">{card.lastEditedBy}</span>
                    {card.lastEditedAt && (
                      <span> em {new Date(card.lastEditedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    )}
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
