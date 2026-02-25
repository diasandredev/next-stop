import { useState, useRef } from 'react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileJson, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';
import { useImportCards } from '@/hooks/kanban/useImportCards';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportCardsDialogProps {
    dashboardId: string;
    startDate?: string;
    days?: number;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export const ImportCardsDialog = ({
    dashboardId,
    startDate,
    days,
    open,
    onOpenChange,
    trigger
}: ImportCardsDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { importCards } = useImportCards();
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<{
        count: number;
        warnings: string[];
        errors: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file: File) => {
        if (file.type !== "application/json" && !file.name.endsWith('.json')) {
            toast.error("Invalid file type. Please upload a JSON file.");
            return false;
        }
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (validateFile(droppedFile)) {
                handleFileSelect(droppedFile);
            }
        }
    };

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsLoading(true);

        try {
            const text = await selectedFile.text();

            const json = JSON.parse(text);
            const count = Array.isArray(json.cards) ? json.cards.length : 0;

            setPreview({
                count,
                warnings: [],
                errors: []
            });
        } catch (e) {
            setPreview({
                count: 0,
                warnings: [],
                errors: ["Invalid JSON file"]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsLoading(true);
        try {
            const text = await file.text();
            const result = await importCards(text, dashboardId, startDate, days);

            if (result.importedCount > 0) {
                toast.success(`Successfully imported ${result.importedCount} cards`);
                setIsOpen(false);
                onOpenChange?.(false);
                reset();
            } else if (result.errors.length > 0) {
                toast.error(`Failed to import cards: ${result.errors[0]}`);
            } else {
                toast.warning("No cards were imported (check date ranges)");
            }

            if (result.warnings.length > 0) {
                // Warn about skipped cards
                toast.warning(`${result.warnings.length} cards skipped due to date range issues`);
            }
        } catch (e) {
            toast.error("An error occurred during import");
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = () => {
        const link = document.createElement('a');
        link.href = '/templates/cards-import-template.json';
        link.download = 'cards-import-template.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const reset = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Dialog open={open ?? isOpen} onOpenChange={onOpenChange ?? setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="md:max-w-md p-0 md:p-6 flex flex-col h-full md:h-auto">
                <DialogHeader className="px-4 md:px-0 pt-4 md:pt-0">
                    <DialogTitle>Import Cards</DialogTitle>
                    <DialogDescription>
                        Upload a JSON file to import cards into this dashboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 px-4 md:px-0 flex-1 overflow-y-auto">
                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2 text-xs h-8">
                            <Download className="w-3.5 h-3.5" />
                            Download Template
                        </Button>
                    </div>

                    {!file ? (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-colors cursor-pointer",
                                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".json,application/json"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            />
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground">JSON files only</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileJson className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={reset}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {preview && (
                                <div className="space-y-2 pt-2 border-t border-border">
                                    {preview.errors.length > 0 ? (
                                        <div className="flex items-center gap-2 text-destructive text-sm">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Invalid file format</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Found {preview.count} cards to import</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="px-4 md:px-0 pb-4 md:pb-0">
                    <Button variant="outline" onClick={() => (onOpenChange ?? setIsOpen)(false)}>Cancel</Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || isLoading || (preview?.errors.length ?? 0) > 0}
                    >
                        {isLoading ? "Importing..." : "Import Cards"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
