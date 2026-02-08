
import {
    Command,
    CommandList,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GooglePlace {
    id: string;
    displayName: string;
    formattedAddress: string;
    location?: {
        lat: (() => number) | number;
        lng: (() => number) | number;
    };
}

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        google: any; // Keep any for simplicity as strictly typing the whole namespace is complex without types
    }
}

interface LocationSearchProps {
    onLocationSelect: (location: {
        name: string;
        address: string;
        lat: number;
        lng: number;
        placeId: string;
    }) => void;
    defaultValue?: string;
    className?: string;
    placeholder?: string;
}

export const LocationSearch = ({ onLocationSelect, defaultValue, className, placeholder }: LocationSearchProps) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState(defaultValue || "");
    const [isLoading, setIsLoading] = useState(false);
    const [predictions, setPredictions] = useState<GooglePlace[]>([]);

    const handleSearch = (e?: React.MouseEvent | React.KeyboardEvent) => {
        // Prevent default if it's a form submission or similar
        if (e && 'preventDefault' in e) e.preventDefault();
        e?.stopPropagation(); // Prevent trigger toggle if button is clicked

        if (!inputValue.trim()) return;

        // Check if API is loaded and has the new Places library
        if (!window.google?.maps?.places?.Place) {
            console.error("Google Maps Places API (New) not loaded. Ensure 'places' library is in URL.");
            return;
        }

        setIsLoading(true);
        setPredictions([]);
        setOpen(true); // Force open

        console.log("Searching for:", inputValue);

        window.google.maps.places.Place.searchByText({
            textQuery: inputValue,
            fields: ['id', 'displayName', 'formattedAddress', 'location'],
            maxResultCount: 5,
        }).then(({ places }: { places: GooglePlace[] }) => {
            console.log("API Response places:", places);
            setPredictions(places);
        }).catch((error: unknown) => {
            console.error("Search error:", error);
            setPredictions([]);
        }).finally(() => {
            setIsLoading(false);
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(e);
        }
    };

    const handleSelect = (place: GooglePlace) => {
        if (!place) return;

        console.log("Selected place:", place);

        // Safety checks for location
        const lat = typeof place.location?.lat === 'function' ? place.location.lat() : place.location?.lat;
        const lng = typeof place.location?.lng === 'function' ? place.location.lng() : place.location?.lng;

        const locationData = {
            name: place.displayName,
            address: place.formattedAddress,
            lat: lat,
            lng: lng,
            placeId: place.id,
        };

        setInputValue(locationData.name);
        setPredictions([]);
        setOpen(false);
        onLocationSelect(locationData);
    };

    if (!window.google) {
        return (
            <Button variant="outline" disabled className={cn("w-full justify-start text-left font-normal", className)}>
                <MapPin className="mr-2 h-4 w-4" />
                Google Maps API Key Missing
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn("relative w-full", className)}>
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        className="flex h-10 w-full rounded-lg bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 pl-9 pr-10 text-foreground"
                        placeholder={placeholder || "Search accommodation..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-popover border-border text-popover-foreground" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <Command className="bg-transparent" shouldFilter={false}>
                    <CommandList>
                        {/* Remove CommandGroup if predictions are empty to avoid empty headings if that was the case, 
                             but show specific empty message if searched and nothing found */}
                        {predictions.length > 0 ? (
                            <CommandGroup heading="Results">
                                {predictions.map((place) => (
                                    <CommandItem
                                        key={place.id}
                                        value={place.id + " " + (place.displayName || "")} // Append name to value to help unique keys if needed, but 'value' is internal ID mostly
                                        onSelect={() => handleSelect(place)}
                                        className="cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                                    >
                                        <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{place.displayName || "Unknown Name"}</span>
                                            <span className="text-xs text-muted-foreground">{place.formattedAddress}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ) : null}

                        {!isLoading && predictions.length === 0 && open && inputValue.length > 0 && (
                            <div className="p-4 text-sm text-muted-foreground text-center">
                                {inputValue.length < 3 ? "Type to search..." : "No results found."}
                            </div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
