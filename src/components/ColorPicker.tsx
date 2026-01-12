import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, ChevronLeft, Palette } from 'lucide-react';
import { useKanban } from '@/contexts/KanbanContext';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    className?: string;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ColorPicker({ color, onChange, className, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: ColorPickerProps) {
    const { accountSettings, addCustomColor } = useKanban();
    const [view, setView] = useState<'picker' | 'add'>('picker');
    const [newColor, setNewColor] = useState('#FFFFFF');
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;


    // Curated vibrant colors that look good with transparency
    const defaultColors = [
        'transparent',
        '#3b82f6', // Bright Blue
        '#10b981', // Emerald
        '#ef4444', // Red
        '#a855f7', // Purple
        '#f97316', // Orange
        '#eab308', // Yellow
        '#ec4899', // Pink
        '#14b8a6', // Teal
        '#6366f1', // Indigo
        '#84cc16', // Lime
        '#06b6d4', // Cyan
        '#f43f5e', // Rose
        '#8b5cf6', // Violet
    ];

    const customColors = accountSettings?.customColors || [];
    const allColors = Array.from(new Set([...defaultColors, ...customColors]));

    const handleAddColor = () => {
        let colorToSave = newColor.trim();
        if (!colorToSave.startsWith('#')) {
            colorToSave = '#' + colorToSave;
        }

        if (/^#[0-9A-F]{6}$/i.test(colorToSave)) {
            addCustomColor(colorToSave);
            onChange(colorToSave);
            setView('picker');
            setNewColor('#FFFFFF');
        }
    };

    const ColorGrid = () => (
        <div className="p-3 w-64">
            {view === 'add' ? (
                <div className="space-y-3 animation-in slide-in-from-right-4 fade-in duration-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -ml-1 text-muted-foreground hover:text-white"
                            onClick={() => setView('picker')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium">Add Custom Color</span>
                    </div>

                    <div className="relative h-24 rounded-lg w-full border border-white/10 shadow-inner overflow-hidden group">
                        <div
                            className="absolute inset-0 z-0 transition-colors duration-300"
                            style={{ backgroundColor: newColor.startsWith('#') ? newColor : `#${newColor}` }}
                        />
                        <input
                            type="color"
                            value={newColor.startsWith('#') ? newColor : `#${newColor}`}
                            onChange={(e) => setNewColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <span className="text-xs text-white font-medium drop-shadow-md">Click to pick</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">HEX</span>
                            <Input
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                                className="pl-10 bg-[#1a1a1a] border-white/10 h-9 text-sm font-mono focus-visible:ring-1 focus-visible:ring-white/20"
                                placeholder="#000000"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddColor();
                                }}
                            />
                        </div>
                        <Button size="sm" onClick={handleAddColor} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4">
                            Save
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="animation-in slide-in-from-left-4 fade-in duration-200">
                    <div className="grid grid-cols-5 gap-2">
                        {allColors.map((c) => (
                            <button
                                key={c}
                                onClick={() => onChange(c)}
                                className={cn(
                                    "w-8 h-8 rounded-full border border-white/10 transition-all hover:scale-110 flex items-center justify-center relative group",
                                    color === c ? "ring-2 ring-white border-transparent" : "hover:border-white/50"
                                )}
                                style={{ backgroundColor: c === 'transparent' ? 'transparent' : c }}
                                title={c === 'transparent' ? 'No Color' : c}
                            >
                                {c === 'transparent' && (
                                    <div className="w-full h-full border border-red-500/50 rotate-45 transform scale-x-0 absolute" />
                                )}
                                {color === c && c !== 'transparent' && (
                                    <Check className="w-4 h-4 text-white drop-shadow-md" />
                                )}
                            </button>
                        ))}
                        <button
                            onClick={() => setView('add')}
                            className="w-8 h-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-muted-foreground hover:text-white group"
                            title="Add custom color"
                        >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (trigger) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {trigger}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl rounded-xl shadow-2xl" sideOffset={5} align="end" collisionPadding={16}>
                    <ColorGrid />
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <div className={cn("inline-block p-2 bg-[#0a0a0a]/50 rounded-xl border border-white/5", className)}>
            <ColorGrid />
        </div>
    );
}
