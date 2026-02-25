import { useState, useEffect } from 'react';
import { useKanban } from '@/contexts/KanbanContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface MobileQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileQuickAdd({ open, onOpenChange }: MobileQuickAddProps) {
  const { addCard, dashboards, currentTripId } = useKanban();
  const [title, setTitle] = useState('');
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const tripDashboards = dashboards.filter(d => d.tripId === currentTripId);

  useEffect(() => {
    if (open && tripDashboards.length > 0 && !selectedDashboardId) {
      setSelectedDashboardId(tripDashboards[0].id);
      const firstDashboard = tripDashboards[0];
      if (firstDashboard.startDate) {
        setSelectedDate(firstDashboard.startDate);
      } else {
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      }
    }
  }, [open, tripDashboards, selectedDashboardId]);

  const handleCreate = () => {
    if (!title.trim() || !selectedDashboardId || !selectedDate) return;

    const dashboard = tripDashboards.find(d => d.id === selectedDashboardId);
    if (!dashboard) return;

    addCard({
      title: title.trim(),
      date: selectedDate,
      columnType: 'day',
      order: 0,
      dashboardId: selectedDashboardId,
      completed: false,
      type: 'default'
    });

    setTitle('');
    setSelectedDashboardId('');
    setSelectedDate('');
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle('');
      setSelectedDashboardId('');
      setSelectedDate('');
    }
    onOpenChange(isOpen);
  };

  const availableDates = [];
  if (selectedDashboardId) {
    const dashboard = tripDashboards.find(d => d.id === selectedDashboardId);
    if (dashboard) {
      const startDate = dashboard.startDate ? new Date(dashboard.startDate) : new Date();
      for (let i = 0; i < (dashboard.days || 1); i++) {
        const date = addDays(startDate, i);
        availableDates.push({
          value: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEE, MMM d')
        });
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full md:max-w-md sm:max-w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Card
          </SheetTitle>
          <SheetDescription>
            Adicione um item ao seu itinerário
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <Input
            placeholder="O que você vai fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-base"
            autoFocus
          />

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destino
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tripDashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  type="button"
                  onClick={() => setSelectedDashboardId(dashboard.id)}
                  className={cn(
                    "p-3 rounded-xl text-left transition-all text-sm min-h-[56px] touch-manipulation",
                    selectedDashboardId === dashboard.id
                      ? "bg-primary/10 border-2 border-primary text-foreground"
                      : "bg-muted/50 border-2 border-transparent hover:border-border text-muted-foreground"
                  )}
                >
                  {dashboard.name}
                </button>
              ))}
            </div>
          </div>

          {selectedDashboardId && availableDates.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableDates.map((date) => (
                  <button
                    key={date.value}
                    type="button"
                    onClick={() => setSelectedDate(date.value)}
                    className={cn(
                      "p-3 rounded-xl text-center text-sm min-h-[56px] touch-manipulation",
                      selectedDate === date.value
                        ? "bg-primary/10 border-2 border-primary text-foreground"
                        : "bg-muted/50 border-2 border-transparent hover:border-border text-muted-foreground"
                    )}
                  >
                    {date.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || !selectedDashboardId || !selectedDate}
            className="w-full h-12 text-base"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
