import { Group } from '@/types/group';
import { Card, Dashboard } from '@/types/kanban';
import { Button } from './ui/button';
import { X, Plus } from 'lucide-react';
import { GroupColumn } from '@/components/GroupColumn';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    groups: Group[];
    cards: Card[];
    dashboards: Dashboard[];
    activeDashboardId: string | undefined;
    onActiveDashboardChange: (dashboardId: string) => void;
    onAddGroup: (dashboardId: string, name: string) => void;
    onUpdateGroup: (id: string, updates: Partial<Group>) => void;
    onDeleteGroup: (id: string) => void;
}

export const RightSidebar = ({
    isExpanded,
    onToggle,
    groups,
    cards,
    dashboards,
    activeDashboardId,
    onActiveDashboardChange,
    onAddGroup,
    onUpdateGroup,
    onDeleteGroup
}: RightSidebarProps) => {
    const [newGroupId, setNewGroupId] = useState<string | null>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Filter groups for active dashboard
    const dashboardGroups = groups
        .filter(g => g.dashboardId === activeDashboardId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Auto-select first dashboard if none selected
    useEffect(() => {
        if (!activeDashboardId && dashboards.length > 0) {
            onActiveDashboardChange(dashboards[0].id);
        }
    }, [activeDashboardId, dashboards, onActiveDashboardChange]);

    const handleAddGroup = () => {
        if (!activeDashboardId) return;

        // Create group with default name
        const groupNumber = dashboardGroups.length + 1;
        const defaultName = `New Group ${groupNumber}`;

        // Generate a temporary ID to track the new group
        const tempId = `temp-${Date.now()}`;
        setNewGroupId(tempId);

        // Add the group
        onAddGroup(activeDashboardId, defaultName);
    };

    // Reset newGroupId when groups change (after the new group is created)
    useEffect(() => {
        if (newGroupId && dashboardGroups.length > 0) {
            // Find the most recently created group
            const newestGroup = dashboardGroups.reduce((newest, current) => {
                return new Date(current.createdAt) > new Date(newest.createdAt) ? current : newest;
            });

            // Clear the temp ID after a short delay to allow the group to render
            setTimeout(() => setNewGroupId(null), 100);
        }
    }, [dashboardGroups.length, newGroupId]);

    if (!activeDashboardId || dashboards.length === 0) return null;

    return (
        <div
            ref={sidebarRef}
            className={cn(
                "fixed top-0 right-0 h-screen bg-background border-l border-border z-40 transition-all duration-300 ease-in-out shadow-2xl",
                isExpanded ? 'w-[400px]' : 'w-0'
            )}
        >

            {/* Sidebar Content */}
            <div className={cn(
                "h-full flex flex-col transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <h2 className="text-2xl font-bold text-foreground">Groups</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-8 w-8 rounded-lg hover:bg-muted"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Dashboard Tabs */}
                <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                        {dashboards.map(dashboard => (
                            <button
                                key={dashboard.id}
                                onClick={() => onActiveDashboardChange(dashboard.id)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
                                    activeDashboardId === dashboard.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {dashboard.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* New Group Button */}
                <div className="px-4 py-4">
                    <Button
                        onClick={handleAddGroup}
                        className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Group
                    </Button>
                </div>

                {/* Groups Container */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="flex flex-col gap-3">
                        {dashboardGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <svg className="w-12 h-12 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">No groups yet</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Create a group to organize your cards</p>
                                </div>
                            </div>
                        ) : (
                            dashboardGroups.map((group, index) => (
                                <GroupColumn
                                    key={group.id}
                                    group={group}
                                    cards={cards.filter(c => c.groupId === group.id)}
                                    onUpdateGroup={onUpdateGroup}
                                    onDeleteGroup={onDeleteGroup}
                                    autoFocusName={index === dashboardGroups.length - 1 && newGroupId !== null}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
