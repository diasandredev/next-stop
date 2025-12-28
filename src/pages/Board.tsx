import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useKanban } from '@/contexts/KanbanContext';
import { Button } from '@/components/ui/button';
import { DayColumn } from '@/components/DayColumn';
import { ExtraColumn } from '@/components/ExtraColumn';
import { SyncStatus } from '@/components/SyncStatus';
import { Sidebar } from '@/components/Sidebar';

import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Card, Calendar as CalendarType } from '@/types/kanban';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NewCalendarDialog } from '@/components/NewCalendarDialog';
import { CalendarSettingsDialog } from '@/components/CalendarSettingsDialog';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';
import { formatInTimeZone } from 'date-fns-tz';

const Board = () => {
  const { logout, user } = useAuth();
  const {
    cards,
    extraColumns,
    updateCard,
    calendars,
    currentCalendarId,
    setCurrentCalendarId,
    accountSettings,
    isLoading
  } = useKanban();




  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const d = new Date(today.setDate(diff));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [showNewCalendarDialog, setShowNewCalendarDialog] = useState(false);
  const [showCalendarSettingsDialog, setShowCalendarSettingsDialog] = useState(false);
  const [showAccountSettingsDialog, setShowAccountSettingsDialog] = useState(false);
  const [calendarToEdit, setCalendarToEdit] = useState<CalendarType | null>(null);

  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const timeZone = accountSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = formatInTimeZone(new Date(), timeZone, 'yyyy-MM-dd');

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const d = new Date(today.setDate(diff));
    d.setHours(0, 0, 0, 0);
    setCurrentWeekStart(d);
  };

  const monthYear = currentWeekStart.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

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

    const overData = over.data.current as { type?: string; date?: string; columnId?: string } | undefined;
    const overId = over.id as string;
    const overCard = cards.find(c => c.id === overId);

    // Determine destination group
    let destType: 'day' | 'extra' | null = null;
    let destDate: string | undefined;
    let destExtraId: string | undefined;
    if (overData?.type === 'day') {
      destType = 'day';
      destDate = overData.date;
    } else if (overData?.type === 'extra') {
      destType = 'extra';
      destExtraId = overData.columnId;
    } else if (overCard) {
      destType = overCard.columnType ?? null;
      destDate = overCard.date;
      destExtraId = overCard.extraColumnId;
    }
    if (!destType) return;

    // Destination list (sorted)
    const destList = cards
      .filter(c => (destType === 'day' ? (c.columnType === 'day' && c.date === destDate) : (c.columnType === 'extra' && c.extraColumnId === destExtraId)))
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
      // Move across lists: update column first, then insert and reindex
      if (destType === 'day') {
        updateCard(cardId, { columnType: 'day', date: destDate, extraColumnId: undefined });
      } else {
        updateCard(cardId, { columnType: 'extra', extraColumnId: destExtraId, date: undefined });
      }
      ids.splice(overIndex, 0, cardId);
      ids.forEach((id, idx) => updateCard(id, { order: idx }));
    }
  };

  const currentCalendar = calendars.find(c => c.id === currentCalendarId);

  // ... existing code ...
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

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
        calendars={calendars}
        currentCalendarId={currentCalendarId}
        setCurrentCalendarId={setCurrentCalendarId}
        user={user}
        logout={logout}
        onOpenAccountSettings={() => setShowAccountSettingsDialog(true)}
        onOpenCalendarSettings={() => {
          // calendarToEdit is set by the sidebar before calling this, or we can handle it there
          setShowCalendarSettingsDialog(true);
        }}
        setCalendarToEdit={setCalendarToEdit}
        onOpenNewCalendar={() => setShowNewCalendarDialog(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex-shrink-0 sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
              <h1 className="text-3xl md:text-3xl font-bold text-foreground tracking-tight text-center md:text-left">
                {monthYear}
                {currentCalendar && (
                  <span className="text-xl md:text-2xl font-normal text-muted-foreground ml-2 md:ml-4">
                    {currentCalendar.name}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <SyncStatus />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-muted-foreground/20" onClick={goToCurrentWeek}>
                    <Calendar className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Today</p>
                </TooltipContent>
              </Tooltip>

              <div className="w-px h-6 bg-border mx-2" />

              <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-muted-foreground/20" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-muted-foreground/20" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Board Content */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden bg-background/50">
          <div className="h-full w-full md:min-w-[1024px] flex flex-col p-4 gap-8 overflow-y-auto">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* Week Days - Takes remaining space */}
              <div className="flex-1 flex flex-col md:flex-row gap-4">
                {/* Calculate dynamic slots */}
                {(() => {
                  // Get card counts
                  const getCardCount = (d: Date) => {
                    const dateString = d.toISOString().split('T')[0];
                    return cards.filter(c => c.date === dateString && c.columnType === 'day').length;
                  };

                  const saturdayDate = weekDays[5];
                  const sundayDate = weekDays[6];
                  const satCards = getCardCount(saturdayDate);
                  const sunCards = getCardCount(sundayDate);

                  const weekdayDates = weekDays.slice(0, 5);
                  const maxWeekdayCards = Math.max(...weekdayDates.map(d => getCardCount(d)));

                  // Base configurations
                  const BASE_SAT_SLOTS = 5;
                  const BASE_SUN_SLOTS = 5;
                  const BASE_WEEKDAY_SLOTS = 10;

                  // Calculate natural heights (Header = 1 unit, Slot = 1 unit)
                  // We treat Header as equivalent to 1 slot for height calculation purposes since they are now same height (h-12)
                  // Sunday header is 2 units (h-24)
                  const satHeight = 1 + Math.max(satCards + 1, BASE_SAT_SLOTS);
                  const sunHeight = 2 + Math.max(sunCards + 1, BASE_SUN_SLOTS);
                  const naturalWeekendHeight = satHeight + sunHeight;

                  const naturalWeekdayHeight = 1 + Math.max(maxWeekdayCards + 1, BASE_WEEKDAY_SLOTS);

                  // Determine final synchronized height
                  const finalHeight = Math.max(naturalWeekendHeight, naturalWeekdayHeight);

                  // Derive slots from final height
                  const finalWeekdaySlots = finalHeight - 1;

                  // For weekend, Saturday keeps its natural size (or grows if it has cards), Sunday takes the rest
                  const finalSatSlots = Math.max(satCards + 1, BASE_SAT_SLOTS);
                  // sunSlots = Total - SatHeight - SunHeader (2 units)
                  const finalSunSlots = finalHeight - (1 + finalSatSlots) - 2;

                  return (
                    <>
                      {/* Week Days */}
                      {weekDays.slice(0, 5).map(date => {
                        const dateString = date.toISOString().split('T')[0];
                        const dayCards = cards
                          .filter(c => c.date === dateString && c.columnType === 'day')
                          .sort((a, b) => {
                            // First sort by completion status (uncompleted first)
                            if (a.completed !== b.completed) {
                              return a.completed ? 1 : -1;
                            }

                            // If both are completed, sort by completedAt (oldest first -> newest at bottom)
                            if (a.completed && b.completed) {
                              const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                              const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                              if (timeA !== timeB) return timeA - timeB;
                            }

                            // If both are uncompleted (or completedAt is equal), sort by order
                            const ao = a.order ?? Number.MAX_SAFE_INTEGER;
                            const bo = b.order ?? Number.MAX_SAFE_INTEGER;
                            if (ao !== bo) return ao - bo;

                            // Finally by creation date
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                          });
                        return (
                          <DayColumn
                            key={dateString}
                            date={date}
                            cards={dayCards}
                            isCurrentDay={dateString === today}
                            minSlots={finalWeekdaySlots}
                          />
                        );
                      })}

                      {/* Weekend (stacked) */}
                      <div className="flex flex-col gap-0 w-full md:w-[calc((100%-16px)/6)]" style={{ flex: '0 0 auto' }}>
                        {/* Saturday */}
                        <DayColumn
                          key={saturdayDate.toISOString().split('T')[0]}
                          date={saturdayDate}
                          cards={cards.filter(c => c.date === saturdayDate.toISOString().split('T')[0] && c.columnType === 'day')}
                          isCurrentDay={saturdayDate.toISOString().split('T')[0] === today}
                          isWeekend
                          minSlots={finalSatSlots}
                        />
                        {/* Sunday */}
                        <DayColumn
                          key={sundayDate.toISOString().split('T')[0]}
                          date={sundayDate}
                          cards={cards.filter(c => c.date === sundayDate.toISOString().split('T')[0] && c.columnType === 'day')}
                          isCurrentDay={sundayDate.toISOString().split('T')[0] === today}
                          isWeekend
                          minSlots={finalSunSlots}
                          headerHeight="h-24"
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Extra Columns - Fixed height at bottom */}
              <div className="flex-shrink-0 flex flex-col md:flex-row gap-4">
                {extraColumns.map(column => {
                  const columnCards = cards
                    .filter(c => c.columnType === 'extra' && c.extraColumnId === column.id)
                    .sort((a, b) => {
                      // First sort by completion status (uncompleted first)
                      if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                      }

                      // If both are completed, sort by completedAt (oldest first -> newest at bottom)
                      if (a.completed && b.completed) {
                        const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                        const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                        if (timeA !== timeB) return timeA - timeB;
                      }

                      // If both are uncompleted (or completedAt is equal), sort by order
                      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
                      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
                      if (ao !== bo) return ao - bo;

                      // Finally by creation date
                      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    });

                  return (
                    <ExtraColumn
                      key={column.id}
                      column={column}
                      cards={columnCards}
                      minSlots={4}
                    />
                  );
                })}
              </div>
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
      </div>

      <NewCalendarDialog
        open={showNewCalendarDialog}
        onOpenChange={setShowNewCalendarDialog}
      />

      <CalendarSettingsDialog
        open={showCalendarSettingsDialog}
        onOpenChange={setShowCalendarSettingsDialog}
        calendar={calendarToEdit}
      />

      <AccountSettingsDialog
        open={showAccountSettingsDialog}
        onOpenChange={setShowAccountSettingsDialog}
      />
    </div>
  );
};

export default Board;
