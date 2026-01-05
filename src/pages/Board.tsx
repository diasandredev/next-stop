import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useKanban } from '@/contexts/KanbanContext';
import { Button } from '@/components/ui/button';
import { SyncStatus } from '@/components/SyncStatus';
import { Sidebar } from '@/components/Sidebar';
import { Loader2, Plus } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Card, Trip } from '@/types/kanban';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NewTripDialog } from '@/components/NewTripDialog';
import { TripSettingsDialog } from '@/components/TripSettingsDialog';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import { formatInTimeZone } from 'date-fns-tz';
import { DashboardView } from '@/components/DashboardView';
import { NoTripsView } from '@/components/NoTripsView';

const Board = () => {
  const { logout, user } = useAuth();
  const {
    cards,
    trips,
    dashboards,
    currentTripId,
    setCurrentTripId,
    updateCard,
    addDashboard,
    isLoading
  } = useKanban();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const [showNewTripDialog, setShowNewTripDialog] = useState(false);
  const [showTripSettingsDialog, setShowTripSettingsDialog] = useState(false);
  const [showAccountSettingsDialog, setShowAccountSettingsDialog] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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
    const overData = over.data.current as { type?: string; date?: string; columnId?: string; dashboardId?: string; parentId?: string; optionId?: string } | undefined;
    const overId = over.id as string;
    const overCard = cards.find(c => c.id === overId);

    // Determine Destination properties
    let destType: 'day' | 'extra' | 'option' | null = null;
    let destDate: string | undefined;
    let destExtraId: string | undefined;
    let destDashboardId: string | undefined;
    let destParentId: string | undefined;
    let destOptionId: string | undefined;

    if (overData?.type === 'day') {
      destType = 'day';
      destDate = overData.date;
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

    if (!destType || !destDashboardId) return;

    // Filter cards for the destination list (sorted)
    let destList: Card[] = [];

    if (destType === 'day') {
      destList = cards.filter(c =>
        c.dashboardId === destDashboardId &&
        c.date === destDate &&
        !c.parentId // Only root cards
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
      } else if (destType === 'option') {
        updates.date = destDate;
        updates.parentId = destParentId;
        updates.optionId = destOptionId;
        updates.optionId = destOptionId;
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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        trips={trips}
        currentTripId={currentTripId}
        setCurrentTripId={setCurrentTripId}
        user={user}
        logout={logout}
        onOpenAccountSettings={() => setShowAccountSettingsDialog(true)}
        onOpenTripSettings={() => {
          // tripToEdit is set by sidebar
          setShowTripSettingsDialog(true);
        }}
        setTripToEdit={setTripToEdit}
        onOpenNewTrip={() => setShowNewTripDialog(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {trips.length === 0 ? (
          <NoTripsView />
        ) : (
          <>
            {/* Header */}
            <header className="px-6 py-4 flex-shrink-0 sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {currentTrip ? currentTrip.name : 'Select a Trip'}
                  </h1>
                  {currentTrip?.startDate && (
                    <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                      {formatInTimeZone(new Date(currentTrip.startDate), timeZone, 'MMM d')}
                      {currentTrip.endDate && ` - ${formatInTimeZone(new Date(currentTrip.endDate), timeZone, 'MMM d')}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">

                  <SyncStatus />
                </div>
              </div>
            </header>

            {/* Board Content (Dashboards) */}
            <main className="flex-1 overflow-y-auto bg-background/50 p-6">
              <div className="max-w-[1920px] mx-auto flex flex-col gap-8 pb-20">
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  {tripDashboards.map(dashboard => (
                    <DashboardView
                      key={dashboard.id}
                      dashboard={dashboard}
                      trip={currentTrip!}
                      cards={cards.filter(c => c.dashboardId === dashboard.id)}
                      today={today}
                    />
                  ))}

                  {/* New Dashboard Button */}
                  {currentTrip && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full max-w-md border-dashed border-2 h-16 text-muted-foreground hover:text-primary hover:border-primary/50"
                        onClick={() => {
                          // Logic moved to useDashboardOperations
                          addDashboard(currentTrip.id, `Dashboard ${tripDashboards.length + 1}`);
                        }}
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Add Dashboard
                      </Button>
                    </div>
                  )}
                  <DragOverlay>
                    {activeCard ? (
                      <div className="bg-blue-900/50 rounded-md p-2 shadow-2xl cursor-grab flex items-center">
                        <p className="text-sm font-medium text-white/50 truncate w-full line-through decoration-transparent">{activeCard.title}</p>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </main>
          </>
        )}
      </div>

      <NewTripDialog
        open={showNewTripDialog}
        onOpenChange={setShowNewTripDialog}
      />

      <TripSettingsDialog
        open={showTripSettingsDialog}
        onOpenChange={setShowTripSettingsDialog}
        trip={tripToEdit}
      />

      <AccountSettingsDialog
        open={showAccountSettingsDialog}
        onOpenChange={setShowAccountSettingsDialog}
      />
    </div>
  );
};

export default Board;
