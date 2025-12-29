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
    extraColumns,
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

    // Determine drop target (could be a DayColumn or ExtractColumn in a Dashboard)
    const overData = over.data.current as { type?: string; date?: string; columnId?: string; dashboardId?: string } | undefined;
    const overId = over.id as string;
    const overCard = cards.find(c => c.id === overId);

    // Determine Destination properties
    let destType: 'day' | 'extra' | null = null;
    let destDate: string | undefined;
    let destExtraId: string | undefined;
    let destDashboardId: string | undefined;

    if (overData?.type === 'day') {
      destType = 'day';
      destDate = overData.date;
      destDashboardId = overData.dashboardId;
    } else if (overData?.type === 'extra') {
      destType = 'extra';
      destExtraId = overData.columnId;
      // ExtraColumn should have dashboardId now? Or we need to look it up from column
      // ExtraColumn component droppable data should ideally include dashboardId?
      // Wait, 'extra-columnId' droppable.
      // In ExtraColumn.tsx I didn't update droppable data to include dashboardId explicitly, 
      // but I can look up the column from 'extraColumns' array.
      const col = extraColumns.find(c => c.id === overData.columnId);
      destDashboardId = col?.dashboardId;
    } else if (overCard) {
      destType = overCard.columnType ?? null;
      destDate = overCard.date;
      destExtraId = overCard.extraColumnId;
      destDashboardId = overCard.dashboardId;
    }

    if (!destType || !destDashboardId) return;

    // Filter cards for the destination list (sorted)
    const destList = cards
      .filter(c =>
        c.dashboardId === destDashboardId &&
        (destType === 'day' ? (c.columnType === 'day' && c.date === destDate) : (c.columnType === 'extra' && c.extraColumnId === destExtraId))
      )
      .sort((a, b) => {
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
        order: overIndex // Start at dragged position, logic below fixes subsequent orders
      };

      if (destType === 'day') {
        updates.columnType = 'day';
        updates.date = destDate;
        updates.extraColumnId = undefined; // Clear extra column
      } else {
        updates.columnType = 'extra';
        updates.extraColumnId = destExtraId;
        updates.date = undefined; // Clear date
      }

      // Update the moved card
      updateCard(cardId, updates);

      // Update orders for other cards in dest list
      // Insert visually logic is handled by optimistic UI usually, here we just save.
      // Ideally we reindex everyone.
      ids.splice(overIndex, 0, cardId);
      ids.forEach((id, idx) => {
        if (id !== cardId) updateCard(id, { order: idx });
        // We already updated cardId above, but maybe order wasn't correct if we just set it to overIndex?
        // It's safer to update all.
        // Note: updateCard is async/optimized? 
      });
      // Also update cardId order explicitly if needed
      updateCard(cardId, { ...updates, order: overIndex });
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
                <h1 className="text-3xl font-bold tracking-tight">
                  {currentTrip ? currentTrip.name : 'Select a Trip'}
                </h1>
                <SyncStatus />
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
                      extraColumns={extraColumns}
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
