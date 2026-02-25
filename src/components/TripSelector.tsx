import { useNavigate } from 'react-router-dom';
import { Plane, Plus, Calendar, ChevronRight } from 'lucide-react';
import { Trip } from '@/types/kanban';
import { useKanban } from '@/contexts/KanbanContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface TripSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenNewTrip: () => void;
}

export function TripSelector({ open, onOpenChange, onOpenNewTrip }: TripSelectorProps) {
  const navigate = useNavigate();
  const { trips, currentTripId, setCurrentTripId } = useKanban();

  const handleSelectTrip = (trip: Trip) => {
    setCurrentTripId(trip.id);
    navigate('/board');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full md:max-w-md sm:max-w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Minhas Viagens
          </SheetTitle>
          <SheetDescription>
            Selecione uma viagem para continuar
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {trips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma viagem criada ainda</p>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  onOpenNewTrip();
                }}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Viagem
              </Button>
            </div>
          ) : (
            trips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => handleSelectTrip(trip)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                  currentTripId === trip.id 
                    ? "bg-primary/10 border border-primary/30" 
                    : "bg-muted/50 hover:bg-muted border border-transparent hover:border-border",
                  "touch-manipulation min-h-[64px]"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{trip.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {trip.startDate && (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(trip.startDate), 'MMM d')}
                          {trip.endDate && ` - ${format(new Date(trip.endDate), 'MMM d')}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-col">
          <Button 
            onClick={() => {
              onOpenChange(false);
              onOpenNewTrip();
            }}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Viagem
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1 md:hidden"
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
