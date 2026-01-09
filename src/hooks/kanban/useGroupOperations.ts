import { useCallback } from 'react';
import { Group } from '@/types/group';

interface UseGroupOperationsProps {
    groups: Group[];
    saveGroup: (dashboardId: string, group: Group) => Promise<void>;
    deleteGroup: (dashboardId: string, groupId: string) => Promise<void>;
}

export const useGroupOperations = ({
    groups,
    saveGroup,
    deleteGroup
}: UseGroupOperationsProps) => {

    const addGroup = useCallback((dashboardId: string, name: string) => {
        const newGroup: Group = {
            id: crypto.randomUUID(),
            name,
            dashboardId,
            order: groups.filter(g => g.dashboardId === dashboardId).length,
            createdAt: new Date().toISOString()
        };
        saveGroup(dashboardId, newGroup);
        return newGroup.id;
    }, [groups, saveGroup]);

    const updateGroup = useCallback((id: string, updates: Partial<Group>) => {
        const group = groups.find(g => g.id === id);
        if (group) {
            const updated = { ...group, ...updates };
            saveGroup(group.dashboardId, updated);
        }
    }, [groups, saveGroup]);

    const deleteGroupFn = useCallback((id: string) => {
        const group = groups.find(g => g.id === id);
        if (!group) return;

        deleteGroup(group.dashboardId, id);
    }, [groups, deleteGroup]);

    return {
        addGroup,
        updateGroup,
        deleteGroup: deleteGroupFn
    };
};
