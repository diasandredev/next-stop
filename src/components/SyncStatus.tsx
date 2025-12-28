import React from 'react';
import { useSync } from '@/contexts/SyncContext';
import { Loader2, CheckCircle, CloudOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const SyncStatus: React.FC = () => {
    const { pendingChanges, isSyncing, lastSyncedAt, forceSync, isOnline } = useSync();

    const handleSyncClick = () => {
        forceSync();
    };

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 bg-secondary/50 rounded-full group transition-all duration-300 ease-in-out hover:pr-4 w-fit">
                <CloudOff className="w-4 h-4 flex-shrink-0" />
                <span className="hidden group-hover:inline whitespace-nowrap overflow-hidden transition-all duration-300">
                    Offline
                    {pendingChanges > 0 && ` (${pendingChanges} pending)`}
                </span>
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 bg-secondary/50 rounded-full group transition-all duration-300 ease-in-out hover:pr-4 w-fit">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span className="hidden group-hover:inline whitespace-nowrap overflow-hidden transition-all duration-300">
                    Syncing...
                </span>
            </div>
        );
    }

    if (pendingChanges > 0) {
        return (
            <button
                onClick={handleSyncClick}
                className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-full transition-all duration-300 ease-in-out hover:pr-4 w-fit group"
                title="Click to sync now"
            >
                <RefreshCw className="w-4 h-4 flex-shrink-0" />
                <span className="hidden group-hover:inline whitespace-nowrap overflow-hidden transition-all duration-300">
                    {pendingChanges} unsaved changes
                </span>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 bg-secondary/50 rounded-full group cursor-default transition-all duration-300 ease-in-out hover:pr-4 w-fit">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="hidden group-hover:inline whitespace-nowrap overflow-hidden transition-all duration-300">
                Synced {lastSyncedAt && formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
            </span>
        </div>
    );
};
