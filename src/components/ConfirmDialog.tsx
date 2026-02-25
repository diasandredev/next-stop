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
            <AlertDialogContent className="bg-background border-none text-foreground md:max-w-[500px] p-0 md:p-6 md:rounded-2xl shadow-2xl flex flex-col h-full md:h-auto">
                <AlertDialogTitle className="sr-only">Confirmation</AlertDialogTitle>
                <AlertDialogDescription className="sr-only">
                    Please confirm your action.
                </AlertDialogDescription>

                <div className="flex items-center justify-between mb-4 px-4 md:px-0 pt-4 md:pt-0">
                    <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                        {title}
                        {variant === 'destructive' && <Trash2 className="w-4 h-4 text-muted-foreground" />}
                    </AlertDialogTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full" onClick={() => onOpenChange(false)}>
                        <span className="sr-only">Close</span>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="mb-6 px-4 md:px-0">
                    <div className="bg-muted/30 p-4 rounded-xl">
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 px-4 md:px-0 pb-4 md:pb-0 mt-auto">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
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
                            } text-primary-foreground rounded-full h-10 px-6 font-medium`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>

    );
}
