import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, ChecklistItem } from "@/types/kanban";
import { useKanban } from "@/contexts/KanbanContext";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Trash2,
  MoreHorizontal,
  Circle,
  CheckSquare,
  Plus,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LocationSearch } from "./LocationSearch";
import { MapPin, Map } from "lucide-react";
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
import { ColorPicker } from "./ColorPicker";
import { TimePicker } from "./TimePicker";
import { EmojiPicker } from "./EmojiPicker";
import { createGoogleMapsLocationUrl } from "@/utils/googleMapsUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";

interface EditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
}

export const EditCardDialog = ({
  open,
  onOpenChange,
  card,
}: EditCardDialogProps) => {
  const { updateCard, deleteCard } = useKanban();
  const [title, setTitle] = useState(card.title);
  const [icon, setIcon] = useState(card.icon);
  const [description, setDescription] = useState(card.description || "");
  const [color, setColor] = useState(card.color || "transparent");
  const [time, setTime] = useState(card.time || "");
  const [cost, setCost] = useState(
    card.cost !== undefined ? card.cost.toFixed(2) : "",
  );
  const [currency, setCurrency] = useState(card.currency || "USD");
  const [location, setLocation] = useState(card.location);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    card.checklist || [],
  );
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Ref to track if we need to save on close
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (open) {
      setTitle(card.title);
      setIcon(card.icon);
      setDescription(card.description || "");
      setColor(card.color || "transparent");
      setTime(card.time || "");
      setCost(card.cost !== undefined ? card.cost.toFixed(2) : "");
      setCurrency(card.currency || "USD");
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

  const handleLocationSelect = (newLocation: NonNullable<Card["location"]>) => {
    setLocation(newLocation);
    dirtyRef.current = true;
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem.trim(),
      completed: false,
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistItem("");
    dirtyRef.current = true;
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
    dirtyRef.current = true;
  };

  const deleteChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter((item) => item.id !== itemId));
    dirtyRef.current = true;
  };

  const editChecklistItemText = (itemId: string, newText: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, text: newText } : item,
      ),
    );
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
      window.open(mapsUrl, "_blank");
    }
  };

  const dateString = card.date
    ? new Date(card.date)
      .toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
      .replace(/,/g, "")
    : "No date";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        hideCloseButton
        className="bg-background border-none text-foreground md:max-w-[600px] p-0 gap-0 md:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto"
      >
        <DialogTitle className="sr-only">Edit Card</DialogTitle>
        <DialogDescription className="sr-only">
          Edit the details of your card
        </DialogDescription>

        <TooltipProvider>
          {/* Header / Actions Bar - Clean and Minimal */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-muted/20">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-accent h-8 w-8"
                      >
                        <Circle
                          className="w-4 h-4"
                          style={{
                            fill:
                              color === "transparent" ? "transparent" : color,
                            color:
                              color === "transparent" ? "currentColor" : color,
                          }}
                        />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Color</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="end"
                  className="w-auto p-3 bg-popover border-border"
                >
                  <ColorPicker color={color} onChange={handleColorChange} />
                </PopoverContent>
              </Popover>

              {/* Delete */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-full h-8 w-8"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>

              {/* More Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-8 w-8"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-popover border-border text-popover-foreground"
                >
                  <DropdownMenuItem
                    onClick={handleDiscardChanges}
                    className="text-red-400 focus:text-red-400 focus:bg-accent cursor-pointer"
                  >
                    Discard changes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Close (saves automatically if dirty) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
                    onClick={() => handleClose(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Close</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto md:max-h-[85vh]">
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
                className="font-bold bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none placeholder:text-muted-foreground/50 h-auto flex-1 text-3xl md:text-3xl leading-tight text-foreground"
                placeholder="Task title"
              />
            </div>

            {/* 2. Properties Grid - Fixed Layout to prevent shifts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
              {/* Time Column */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground ml-1">
                  Time
                </Label>
                <div className="flex items-center bg-card rounded-lg border border-border px-2 h-10">
                  <TimePicker
                    time={time}
                    onChange={(newTime) => {
                      setTime(newTime);
                      dirtyRef.current = true;
                    }}
                    className="w-full bg-transparent border-none p-0 h-full text-sm focus:ring-0 hover:bg-transparent hover:pl-0 hover:pr-0 text-foreground transition-none"
                  />
                </div>
              </div>

              {/* Cost Column */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground ml-1">
                  Cost
                </Label>
                <div className="flex items-center bg-card rounded-lg border border-border px-3 h-10 gap-2 focus-within:ring-1 focus-within:ring-ring transition-all">
                  <div className="shrink-0 text-muted-foreground">
                    <Select
                      value={currency}
                      onValueChange={(v) => {
                        setCurrency(v);
                        dirtyRef.current = true;
                      }}
                    >
                      <SelectTrigger className="w-auto h-auto p-0 border-none bg-transparent text-xs font-medium gap-1 text-muted-foreground hover:text-foreground focus:ring-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground min-w-[80px]">
                        <SelectItem
                          value="USD"
                          className="text-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          USD
                        </SelectItem>
                        <SelectItem
                          value="EUR"
                          className="text-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          EUR
                        </SelectItem>
                        <SelectItem
                          value="BRL"
                          className="text-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          BRL
                        </SelectItem>
                        <SelectItem
                          value="GBP"
                          className="text-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          GBP
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => {
                      setCost(e.target.value);
                      dirtyRef.current = true;
                    }}
                    onBlur={() => {
                      if (cost) {
                        const num = parseFloat(cost);
                        if (!isNaN(num)) {
                          setCost(num.toFixed(2));
                        }
                      }
                    }}
                    className="h-full w-full bg-transparent border-none p-0 text-sm focus:outline-none placeholder:text-muted-foreground/30 text-foreground"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* 3. Location Section */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground ml-1">
                Location
              </Label>
              {location ? (
                <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border group hover:bg-muted/40 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {location.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {location.address}
                    </p>
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
                      <TooltipContent>
                        <p>Open in Maps</p>
                      </TooltipContent>
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
                <LocationSearch
                  onLocationSelect={handleLocationSelect}
                  defaultValue={location?.name}
                  placeholder="Search location..."
                />
              )}
            </div>

            <div className="w-full h-px bg-border" />

            {/* 4. Checklist Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Checklist</span>
                </div>
                <span className="text-xs text-muted-foreground/50">
                  {checklist.filter((i) => i.completed).length}/
                  {checklist.length}
                </span>
              </div>

              <div className="space-y-2 pl-1">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <button
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex-shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${item.completed ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/50"}`}
                    >
                      {item.completed && <CheckSquare className="w-3 h-3" />}
                    </button>
                    <Input
                      value={item.text}
                      onChange={(e) => editChecklistItemText(item.id, e.target.value)}
                      className={`flex-1 h-auto py-0 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 shadow-none text-sm transition-all ${item.completed ? "text-muted-foreground line-through decoration-border" : "text-foreground"}`}
                    />
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
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChecklistItem();
                      }
                    }}
                    placeholder="Add item"
                    className="h-8 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 placeholder:text-muted-foreground/40 text-sm shadow-none text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-border" />

            {/* 5. Notes Section */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground ml-1">
                Notes
              </Label>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  dirtyRef.current = true;
                }}
                className="bg-muted/20 border-none resize-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 p-4 min-h-[100px] text-sm text-foreground focus:bg-muted/30 transition-colors rounded-xl shadow-none placeholder:text-muted-foreground/50"
                placeholder="Add details, reservation numbers, or thoughts..."
              />
            </div>

            {/* Footer / Meta */}
            {(card.createdBy || card.lastEditedBy) && (
              <div className="pt-2 flex flex-col gap-1">
                {card.createdBy && (
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                    Created by{" "}
                    <span className="text-foreground ml-1">
                      {card.createdBy}
                    </span>
                  </p>
                )}
                {card.lastEditedBy && card.lastEditedBy !== card.createdBy && (
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                    Edited by{" "}
                    <span className="text-foreground ml-1">
                      {card.lastEditedBy}
                    </span>
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
