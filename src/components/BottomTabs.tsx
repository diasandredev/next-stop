import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, Wallet, PanelRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomTabsProps {
  currentTripId: string | null;
  onOpenTripSelector?: () => void;
  onOpenDashboardSelector?: () => void;
  onOpenGroups?: () => void;
}

export function BottomTabs({ currentTripId, onOpenTripSelector, onOpenDashboardSelector, onOpenGroups }: BottomTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isOnMap = location.pathname === '/map';
  const isOnBoard = location.pathname === '/board';
  const isOnExpenses = location.pathname === '/expenses';


  const handleBoardClick = () => {
    if (!currentTripId && onOpenTripSelector) {
      onOpenTripSelector();
    } else {
      navigate('/board');
    }
  };

  const handleMapClick = () => {
    if (!currentTripId && onOpenTripSelector) {
      onOpenTripSelector();
    } else if (onOpenDashboardSelector) {
      onOpenDashboardSelector();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {/* Board Tab */}
        <button
          onClick={handleBoardClick}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
            isOnBoard && currentTripId
              ? 'text-primary'
              : !currentTripId
                ? 'text-amber-500'
                : 'text-muted-foreground'
          )}
        >
          <div className="relative">
            <LayoutDashboard className="w-5 h-5" />
            {!currentTripId && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] font-medium">Board</span>
          {isOnBoard && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        {/* Map Tab */}
        <button
          onClick={handleMapClick}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
            isOnMap
              ? 'text-primary'
              : !currentTripId
                ? 'text-amber-500'
                : 'text-muted-foreground'
          )}
        >
          <div className="relative">
            <Map className="w-5 h-5" />
            {!currentTripId && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] font-medium">Map</span>
            {currentTripId && <ChevronDown className="w-3 h-3" />}
          </div>
          {isOnMap && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
        </button>

        {/* Groups Tab */}
        <button
          onClick={onOpenGroups}
          disabled={!currentTripId}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative',
            !currentTripId
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground'
          )}
        >
          <PanelRight className="w-5 h-5" />
          <span className="text-[10px] font-medium">Groups</span>
        </button>

        {/* Expenses Tab - Disabled */}
        <button
          disabled
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground/30 cursor-not-allowed"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium">Expenses</span>
        </button>


      </div>
    </nav>
  );
}
