import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
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
            <AlertDialogContent className="bg-[#1a1a1a] border-none text-white sm:max-w-[500px] p-6 rounded-2xl shadow-2xl">
                <AlertDialogTitle className="sr-only">Confirmation</AlertDialogTitle>
                <AlertDialogDescription className="sr-only">
                    Please confirm your action.
                </AlertDialogDescription>

                <div className="flex items-center justify-between mb-4">
                    <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                        {title}
                        {variant === 'destructive' && <Trash2 className="w-4 h-4 text-muted-foreground" />}
                    </AlertDialogTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full" onClick={() => onOpenChange(false)}>
                        <span className="sr-only">Close</span>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="mb-6">
                    <div className="bg-white/5 p-4 rounded-xl">
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-muted-foreground hover:text-white hover:bg-white/10 rounded-full"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className={`${variant === 'destructive'
                            ? 'bg-red-600 hover:bg-red-500'
                            : 'bg-primary hover:bg-primary/90'
                            } text-white rounded-full h-10 px-6 font-medium`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
