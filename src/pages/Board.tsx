import { useState, useEffect } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { Button } from '@/components/ui/button';
import { RightSidebar } from '@/components/RightSidebar';
import { MobileQuickAdd } from '@/components/MobileQuickAdd';
import { Calendar, Plus, Settings, Users, PanelRight, FileDown, FileText, Search } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Card } from '@/types/kanban';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TripSettingsDialog } from '@/components/TripSettingsDialog';
import { ShareTripDialog } from '@/components/ShareTripDialog';
import { formatInTimeZone } from 'date-fns-tz';
import { DashboardView } from '@/components/DashboardView';
import { NoTripsView } from '@/components/NoTripsView';
import { generateTripPDF } from '@/utils/pdfExport';
import { SEO } from '@/components/SEO';

const Board = () => {
  const {
    cards,
    trips,
    dashboards,
    groups,
    currentTripId,
    updateCard,
    updateTrip,
    addDashboard,
    addGroup,
    updateGroup,
    deleteGroup,
  } = useKanban();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [showTripSettingsDialog, setShowTripSettingsDialog] = useState(false);
  const [showShareTripDialog, setShowShareTripDialog] = useState(false);
  const [showMobileAdd, setShowMobileAdd] = useState(false);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(false);
  const [activeDashboardId, setActiveDashboardId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        window.dispatchEvent(new Event('kanban-new-card'));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('board-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derived state
  const currentTrip = trips.find(t => t.id === currentTripId);
  const tripDashboards = dashboards
    .filter(d => d.tripId === currentTripId)
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

  // Date stuff
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Or use settings
  const today = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const card = cards.find(c => c.id === cardId);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);

    if (!over) return;

    const cardId = active.id as string;
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    // Determine drop target
    const overData = over.data.current as { type?: string; date?: string; columnId?: string; dashboardId?: string; parentId?: string; optionId?: string; groupId?: string } | undefined;
    const overId = over.id as string;
    const overCard = cards.find(c => c.id === overId);

    // Determine Destination properties
    let destType: 'day' | 'extra' | 'option' | 'group' | null = null;
    let destDate: string | undefined;
    let destDashboardId: string | undefined;
    let destParentId: string | undefined;
    let destOptionId: string | undefined;
    let destGroupId: string | undefined;

    if (overData?.type === 'day') {
      destType = 'day';
      destDate = overData.date;
      destDashboardId = overData.dashboardId;
    } else if (overData?.type === 'group') {
      destType = 'group';
      destGroupId = overData.groupId;
      destDashboardId = overData.dashboardId;
    } else if (overData?.type === 'option') {
      destType = 'option';
      destDashboardId = overData.dashboardId;
      destParentId = overData.parentId;
      destOptionId = overData.optionId;
      // Inherit date from parent if possible, but actually OptionsCard is in a DayColumn, so date matches
      // We can find the parent card to get the date
      const parentCard = cards.find(c => c.id === destParentId);
      destDate = parentCard?.date;
    } else if (overCard) {
      // If dropping ONTO a card
      // Check if the card is in a group
      if (overCard.groupId) {
        destType = 'group';
        destGroupId = overCard.groupId;
        destDashboardId = overCard.dashboardId;
      } else {
        destType = 'day'; // Default to day if not obvious, or check context. 
        // Actually if dropping on a card, it's likely a day card since extra is gone.
        destDate = overCard.date;
        destDashboardId = overCard.dashboardId;

        // Check if the card we are dropping onto is INSIDE an option
        if (overCard.parentId) {
          destType = 'option';
          destParentId = overCard.parentId;
          destOptionId = overCard.optionId;
        }
      }
    }

    if (!destType || !destDashboardId) return;

    // Filter cards for the destination list (sorted)
    let destList: Card[] = [];

    if (destType === 'day') {
      destList = cards.filter(c =>
        c.dashboardId === destDashboardId &&
        c.date === destDate &&
        !c.parentId // Only root cards
      );
    } else if (destType === 'group') {
      destList = cards.filter(c =>
        c.groupId === destGroupId
      );
    } else if (destType === 'option') {
      destList = cards.filter(c =>
        c.parentId === destParentId &&
        c.optionId === destOptionId
      );
    }

    destList = destList.sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Determine target index
    const overIndex = overCard ? destList.findIndex(c => c.id === overCard.id) : destList.length;

    // Build new order of IDs
    const ids = destList.map(c => c.id);
    const currentIndexInDest = ids.indexOf(cardId);

    if (currentIndexInDest >= 0) {
      // Reorder within same list
      const reordered = arrayMove(ids, currentIndexInDest, overIndex);
      reordered.forEach((id, idx) => updateCard(id, { order: idx }));
    } else {
      // Move across lists: update properties
      const updates: Partial<Card> = {
        dashboardId: destDashboardId,
        order: overIndex
      };

      if (destType === 'day') {
        updates.date = destDate;
        updates.parentId = undefined; // Clear option parents
        updates.optionId = undefined;
        updates.groupId = undefined; // Clear group
      } else if (destType === 'group') {
        updates.groupId = destGroupId;
        updates.date = undefined; // Clear date
        updates.parentId = undefined;
        updates.optionId = undefined;
      } else if (destType === 'option') {
        updates.date = destDate;
        updates.parentId = destParentId;
        updates.optionId = destOptionId;
        updates.optionId = destOptionId;
        updates.groupId = undefined; // Clear group
      }

      // Update the moved card
      updateCard(cardId, updates);

      // CRITICAL FIX: If the moved card is an 'options' container, we must update all its children
      // to reflect the new dashboardId and date (if applicable).
      // Children always inherit date and dashboardId from their parent option container.
      if (card.type === 'options') {
        // Find all children
        const children = cards.filter(c => c.parentId === cardId);
        children.forEach(child => {
          const childUpdates: Partial<Card> = {
            dashboardId: updates.dashboardId ?? child.dashboardId,
          };
          // If moving to a new day, update date
          if (updates.date !== undefined && updates.date !== child.date) {
            childUpdates.date = updates.date;
          }
          // If moving to extra column (unlikely for options, but possible in theory), 
          // we might need to handle columnType, but options usually stay in 'day' or act as 'day' types.
          // Assuming options only live in Day columns for now.

          updateCard(child.id, childUpdates);
        });
      }

      // Reorder destination list
      // Since destList didn't include the new card, we insert it virtually
      // But actually, just setting the order to overIndex is risky if there are gaps.
      // Better to shift everyone >= overIndex

      // Simplest approach: Just update order. Sort is stable.
      // But if we insert at 0, and there is already a 0...
      // We should probably re-index the destination list + the new item.

      const newIds = [...ids];
      // Ensure we don't duplicate
      if (!newIds.includes(cardId)) {
        // Correct insertion point
        // if overIndex is -1 (not found, e.g. dropped on container), append
        const insertAt = (overIndex === -1) ? newIds.length : overIndex;
        newIds.splice(insertAt, 0, cardId); // actually cardId is not in ids yet since it's from another list

        // Update all
        newIds.forEach((id, idx) => {
          if (id === cardId) {
            // handled by first updateCard but let's be safe
            // We merge updates with new order
            updateCard(id, { ...updates, order: idx });
          } else {
            updateCard(id, { order: idx });
          }
        });
      }
    }
  };

  const handleExportPDF = () => {
    if (!currentTrip) return;
    // tripDashboards is already filtered
    const tripCards = cards.filter(c => tripDashboards.some(d => d.id === c.dashboardId));
    const tripGroups = groups.filter(g => tripDashboards.some(d => d.id === g.dashboardId));
    generateTripPDF(currentTrip, tripDashboards, tripCards, tripGroups);
  };

  if (trips.length === 0) {
    return <NoTripsView />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <SEO title="Dashboard" />
      {/* Header */}
      <header className="px-4 pl-[3.25rem] md:px-6 md:pl-6 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 md:py-4 flex-shrink-0 sticky top-0 z-10 bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center justify-between gap-2">
          {/* Left Section - Trip Info */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
              {currentTrip ? currentTrip.name : 'Select a Trip'}
            </h1>
            {currentTrip?.startDate && (
              <div className="hidden sm:flex items-center gap-2 bg-secondary/60 text-secondary-foreground h-8 px-3 rounded-lg border border-border/50">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {formatInTimeZone(new Date(currentTrip.startDate), timeZone, 'MMM d')}
                  {currentTrip.endDate && ` - ${formatInTimeZone(new Date(currentTrip.endDate), timeZone, 'MMM d')}`}
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1 border border-border/30">
            {/* Search - Desktop only */}
            <div className="relative hidden md:block">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="board-search"
                placeholder="Search..."
                className="h-9 w-48 focus:w-64 pl-8 pr-10 bg-transparent border-none focus:bg-background/50 transition-all duration-300 placeholder:text-muted-foreground/50 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg hover:bg-primary/20 transition-all duration-200"
                    >
                      <FileDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Export</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border">
                <DropdownMenuItem
                  onClick={handleExportPDF}
                  className="gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-primary/20 transition-all duration-200"
                  onClick={() => {
                    if (currentTrip) {
                      setShowShareTripDialog(true);
                    }
                  }}
                >
                  <Users className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Share Trip</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="right-sidebar-toggle"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-primary/20 transition-all duration-200"
                  onClick={() => {
                    setIsRightSidebarExpanded(!isRightSidebarExpanded);
                  }}
                >
                  <PanelRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Groups</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg hover:bg-primary/20 transition-all duration-200"
                  onClick={() => {
                    if (currentTrip) {
                      setShowTripSettingsDialog(true);
                    }
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Trip Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Board Content (Dashboards) */}
      <main className="flex-1 overflow-y-auto bg-background/50 p-3 md:p-6">
        <div className="max-w-[1920px] mx-auto flex flex-col gap-6 md:gap-8 pb-24 md:pb-20">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {tripDashboards.map(dashboard => (
              <DashboardView
                key={dashboard.id}
                dashboard={dashboard}
                trip={currentTrip!}
                cards={cards.filter(c => c.dashboardId === dashboard.id)}
                today={today}
                searchQuery={searchQuery}
              />
            ))}

            {/* New Dashboard Button */}
            {currentTrip && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full max-w-md border-dashed border-2 h-16 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 hover:bg-muted/50"
                  onClick={() => {
                    addDashboard(currentTrip.id, `City ${tripDashboards.length + 1}`);
                  }}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add City
                </Button>
              </div>
            )}

            {/* Right Sidebar - Inside DndContext - Desktop only */}
            <div className="hidden md:block">
              <RightSidebar
                isExpanded={isRightSidebarExpanded}
                onToggle={() => setIsRightSidebarExpanded(!isRightSidebarExpanded)}
                groups={groups}
                cards={cards}
                dashboards={tripDashboards}
                activeDashboardId={activeDashboardId}
                onActiveDashboardChange={setActiveDashboardId}
                onAddGroup={(dashboardId, name) => addGroup(dashboardId, name)}
                onUpdateGroup={updateGroup}
                onDeleteGroup={deleteGroup}
              />
            </div>

            <DragOverlay dropAnimation={null}>
              {activeCard ? (
                <div className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 shadow-lg cursor-grabbing inline-flex items-center gap-3 backdrop-blur-sm min-w-[200px] z-50">
                  {activeCard.icon && <span className="text-lg shadow-sm">{activeCard.icon}</span>}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-white whitespace-nowrap">{activeCard.title}</p>
                    {activeCard.time && <p className="text-[10px] text-white/50">{activeCard.time}</p>}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {currentTrip && (
        <>
          <TripSettingsDialog
            open={showTripSettingsDialog}
            onOpenChange={setShowTripSettingsDialog}
            trip={currentTrip}
          />

          <ShareTripDialog
            open={showShareTripDialog}
            onOpenChange={setShowShareTripDialog}
            trip={currentTrip}
            onUpdateTrip={updateTrip}
          />
        </>
      )}

      {/* Mobile FAB */}
      {currentTrip && (
        <Button
          onClick={() => setShowMobileAdd(true)}
          className="fixed bottom-24 right-4 z-40 md:hidden w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-manipulation"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <MobileQuickAdd
        open={showMobileAdd}
        onOpenChange={setShowMobileAdd}
      />
    </div>
  );
};

export default Board;
