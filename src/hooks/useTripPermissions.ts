import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Trip } from '@/types/kanban';

export interface TripPermissions {
    canView: boolean;
    canEdit: boolean;
    isOwner: boolean;
    isReadOnly: boolean;
    permissionLevel: 'owner' | 'edit' | 'view' | 'none';
}

/**
 * Hook to determine the current user's permissions for a specific trip.
 * Used to enforce view/edit restrictions in UI components.
 */
export const useTripPermissions = (trip: Trip | null | undefined): TripPermissions => {
    const { user } = useAuth();

    return useMemo(() => {
        // Default: no permissions
        const noPermission: TripPermissions = {
            canView: false,
            canEdit: false,
            isOwner: false,
            isReadOnly: true,
            permissionLevel: 'none',
        };

        if (!trip || !user) {
            return noPermission;
        }

        // Check if user is the owner
        if (trip.ownerId === user.uid) {
            return {
                canView: true,
                canEdit: true,
                isOwner: true,
                isReadOnly: false,
                permissionLevel: 'owner',
            };
        }

        // Check if user is in sharedWith
        const share = trip.sharedWith?.find(s => s.email === user.email);

        if (!share) {
            return noPermission;
        }

        if (share.permission === 'edit') {
            return {
                canView: true,
                canEdit: true,
                isOwner: false,
                isReadOnly: false,
                permissionLevel: 'edit',
            };
        }

        // View-only permission
        return {
            canView: true,
            canEdit: false,
            isOwner: false,
            isReadOnly: true,
            permissionLevel: 'view',
        };
    }, [trip, user]);
};
