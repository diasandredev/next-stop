import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "Continue",
    cancelText = "Cancel",
    variant = "default"
}: ConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-[#E8E1F5] border-none text-black sm:max-w-[500px] p-0 rounded-3xl shadow-2xl overflow-hidden gap-0">
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-6">
                        <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                            {title}
                            {variant === 'destructive' && <Trash2 className="w-4 h-4 text-black/50" />}
                        </AlertDialogTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5" onClick={() => onOpenChange(false)}>
                            <span className="sr-only">Close</span>
                            <X className="w-4 h-4 opacity-50" />
                        </Button>
                    </div>

                    <div className="mb-6 space-y-4">
                        <div className="space-y-2">
                            <div className="bg-white/50 p-4 rounded-xl">
                                <p className="font-medium text-black/80">{description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-[#E8E1F5] p-6 pt-2 flex items-end justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-black/60 hover:text-black hover:bg-black/5 rounded-full"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={`${variant === 'destructive'
                                ? 'bg-[#ff5f57] hover:bg-[#ff5f57]/90 text-white'
                                : 'bg-[#Bfb6d3] hover:bg-[#Bfb6d3]/90 text-white'
                            } rounded-full h-10 px-8 font-bold shadow-none`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
