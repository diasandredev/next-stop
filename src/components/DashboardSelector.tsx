import { useNavigate } from 'react-router-dom';
import { Map, MapPin, Plus, Navigation } from 'lucide-react';
import { Dashboard } from '@/types/kanban';
import { useKanban } from '@/contexts/KanbanContext';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface DashboardSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSelector({ open, onOpenChange }: DashboardSelectorProps) {
  const navigate = useNavigate();
  const { dashboards, currentTripId, setCurrentTripId } = useKanban();

  const tripDashboards = useMemo(() => {
    return dashboards
      .filter(d => d.tripId === currentTripId)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
  }, [dashboards, currentTripId]);

  const handleSelectDashboard = (dashboardId: string) => {
    setCurrentTripId(currentTripId!);
    navigate(`/map?dashboardId=${dashboardId}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full md:max-w-md sm:max-w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Selecione um Destino
          </SheetTitle>
          <SheetDescription>
            Escolha um destino para visualizar no mapa
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {tripDashboards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum destino criado ainda</p>
              <p className="text-xs mt-1">Crie um destino no Board primeiro</p>
            </div>
          ) : (
            tripDashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => handleSelectDashboard(dashboard.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                  "bg-muted/50 hover:bg-muted border border-transparent hover:border-border",
                  "touch-manipulation min-h-[56px]"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ 
                    backgroundColor: dashboard.backgroundColor ? `${dashboard.backgroundColor}20` : 'hsl(var(--muted))',
                    color: dashboard.backgroundColor || 'hsl(var(--foreground))'
                  }}
                >
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{dashboard.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {dashboard.days} {dashboard.days === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
                <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>

        <SheetFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full md:hidden"
          >
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
