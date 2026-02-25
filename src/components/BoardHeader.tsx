import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Search, Menu, ChevronLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useKanban } from '@/contexts/KanbanContext';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { useOutletContext } from 'react-router-dom';

interface BoardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface OutletContext {
  setIsSidebarExpanded?: (expanded: boolean) => void;
  setShowTripSelector?: (open: boolean) => void;
}

export function BoardHeader({ searchQuery, onSearchChange }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { trips, currentTripId } = useKanban();
  const { setShowTripSelector } = useOutletContext<OutletContext>();
  
  const currentTrip = trips.find(t => t.id === currentTripId);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <header className="px-4 md:px-6 py-3 md:py-4 flex-shrink-0 sticky top-0 z-10 bg-gradient-to-r from-background via-background to-background/95 backdrop-blur-md border-b border-border/30 safe-area-pt">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Trip Selector / Back Button */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Mobile: Trip selector button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTripSelector?.(true)}
            className="md:hidden flex items-center gap-2 px-2 h-auto min-h-[44px]"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">
                {currentTrip?.name?.substring(0, 2).toUpperCase() || 'TR'}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs text-muted-foreground">Trip</span>
              <span className="text-sm font-medium truncate max-w-[120px]">
                {currentTrip?.name || 'Select'}
              </span>
            </div>
          </Button>

          {/* Desktop: Trip name */}
          <h1 className="hidden md:block text-xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
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

        {/* Right: Actions */}
        <div className="flex items-center gap-1 bg-secondary/40 rounded-xl p-1 border border-border/30">
          {/* Search - Desktop only */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input 
              id="board-search"
              placeholder="Search..." 
              className="h-9 w-48 focus:w-64 pl-8 pr-10 bg-transparent border-none focus:bg-background/50 transition-all duration-300 placeholder:text-muted-foreground/50 text-sm"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
          <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

          {/* Mobile: Search icon triggers inline search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => {
              // Could open a search sheet in the future
            }}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// Floating Action Button for Mobile
interface FABProps {
  onClick: () => void;
}

export function MobileFAB({ onClick }: FABProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 md:hidden w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 touch-manipulation"
      size="icon"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}
