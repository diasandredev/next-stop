import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ChevronLeft, Layers, Plus, List } from 'lucide-react';
import { useKanban } from '@/contexts/KanbanContext';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TripMapHeaderProps {
  onOpenDashboardSelector?: () => void;
}

export function TripMapHeader({ onOpenDashboardSelector }: TripMapHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dashboards, currentTripId } = useKanban();

  const searchParams = new URLSearchParams(location.search);
  const dashboardId = searchParams.get('dashboardId');

  const tripDashboards = useMemo(() => {
    return dashboards.filter(d => d.tripId === currentTripId);
  }, [dashboards, currentTripId]);

  const currentDashboard = tripDashboards.find(d => d.id === dashboardId);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border safe-area-pt">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/board')}
              className="h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-base font-semibold truncate max-w-[160px]">
                {currentDashboard?.name || 'Mapa'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {tripDashboards.length} destino{tripDashboards.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDashboardSelector}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            <span className="hidden xs:inline">Destinos</span>
          </Button>
        </div>
      </div>

      {/* Desktop Header - floating */}
      <div className="hidden md:block fixed top-4 left-4 z-20">
        <div className="glass-panel rounded-2xl p-1 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/board')}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Board
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDashboardSelector}
            className="gap-2"
          >
            <Layers className="w-4 h-4" />
            {currentDashboard?.name || 'Select'}
          </Button>
        </div>
      </div>
    </>
  );
}
