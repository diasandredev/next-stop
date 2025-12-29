import { Plane } from 'lucide-react';

export const NoTripsView = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-32 h-32 bg-secondary/30 rounded-full flex items-center justify-center mb-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 rounded-full group-hover:scale-110 transition-transform duration-500" />
                <Plane className="w-12 h-12 text-primary relative z-10" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                No trips yet
            </h2>
            <p className="text-muted-foreground max-w-sm text-lg">
                Create your first trip to start planning your next adventure.
            </p>
        </div>
    );
};
