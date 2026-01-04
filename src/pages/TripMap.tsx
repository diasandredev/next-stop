
import { useKanban } from "@/contexts/KanbanContext";
import { useState, useMemo } from "react";
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { Card } from "@/types/kanban";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Define a color palette for days
const DAY_COLORS = [
    "#3b82f6", // blue-500
    "#22c55e", // green-500
    "#eab308", // yellow-500
    "#f97316", // orange-500
    "#ef4444", // red-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
];

export default function TripMap() {
    const { cards } = useKanban();
    const navigate = useNavigate();
    const [popupInfo, setPopupInfo] = useState<Card | null>(null);

    // Filter cards that have location data
    const cardsWithLocation = useMemo(() => {
        return cards.filter(card => card.location && card.location.lat && card.location.lng);
    }, [cards]);

    // Group cards by Date to create routes
    const routes = useMemo(() => {
        // Get unique dates
        const dates = Array.from(new Set(cardsWithLocation.map(c => c.date).filter(Boolean))) as string[];
        dates.sort();

        return dates.map((date, index) => {
            const dayCards = cardsWithLocation
                .filter(card => card.date === date)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            if (dayCards.length === 0) return null;

            const coordinates = dayCards.map(card => [card.location!.lng, card.location!.lat]);

            const color = DAY_COLORS[index % DAY_COLORS.length];

            return {
                id: date,
                name: format(new Date(date), 'MMM dd'), // e.g. "Dec 02"
                fullDate: format(new Date(date), 'EEEE, MMMM do'), // e.g. "Tuesday, December 2nd"
                color: color,
                cards: dayCards, // Keep track of cards for this route
                geojson: {
                    type: 'Feature',
                    properties: {
                        color: color
                    },
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                } as GeoJSON.Feature<GeoJSON.LineString>
            };
        }).filter(Boolean);
    }, [cardsWithLocation]);

    // Calculate initial view state (bounds)
    const initialViewState = useMemo(() => {
        if (cardsWithLocation.length === 0) {
            return {
                longitude: -58.3816, // Buenos Aires fallback (based on user context :) or London -0.1276
                latitude: -34.6037,
                zoom: 12
            };
        }

        const lngs = cardsWithLocation.map(c => c.location!.lng);
        const lats = cardsWithLocation.map(c => c.location!.lat);
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

        return {
            longitude: centerLng,
            latitude: centerLat,
            zoom: 13
        };
    }, [cardsWithLocation]);

    return (
        <div className="h-screen w-screen relative bg-[#1a1a1a]">
            {/* Header / Nav */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
                <Button variant="secondary" onClick={() => navigate('/board')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Board
                </Button>

                {/* Legend */}
                {routes.length > 0 && (
                    <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 shadow-xl max-w-[250px]">
                        <h4 className="text-sm font-semibold text-white mb-3">Itinerary</h4>
                        <div className="flex flex-col gap-2">
                            {routes.map(route => route && (
                                <div key={route.id} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: route.color }}
                                    />
                                    <span className="text-xs text-white/90 font-medium">
                                        {route.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Map
                mapLib={maplibregl}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                attributionControl={false}
            >
                <NavigationControl position="top-right" />

                {routes.map((route) => (
                    route && (
                        <div key={route.id}>
                            {/* Route Line */}
                            {route.cards.length >= 2 && (
                                <Source id={`source-${route.id}`} type="geojson" data={route.geojson}>
                                    <Layer
                                        id={`layer-${route.id}`}
                                        type="line"
                                        layout={{
                                            'line-join': 'round',
                                            'line-cap': 'round'
                                        }}
                                        paint={{
                                            'line-color': route.color,
                                            'line-width': 4,
                                            'line-opacity': 0.8
                                        }}
                                    />
                                </Source>
                            )}

                            {/* Markers for this day */}
                            {route.cards.map((card, index) => (
                                <Marker
                                    key={card.id}
                                    longitude={card.location!.lng}
                                    latitude={card.location!.lat}
                                    anchor="bottom"
                                    onClick={e => {
                                        e.originalEvent.stopPropagation();
                                        setPopupInfo(card);
                                    }}
                                >
                                    <div className="group relative flex flex-col items-center hover:z-50 cursor-pointer">
                                        <div
                                            className="bg-white p-1.5 rounded-full shadow-lg border-2 transition-transform group-hover:scale-110"
                                            style={{ borderColor: route.color }}
                                        >
                                            <MapPin className="w-4 h-4 text-black" fill={route.color} />
                                        </div>
                                        <span
                                            className="mt-1 text-xs font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10 shadow-sm whitespace-nowrap max-w-[150px] truncate"
                                        >
                                            {index + 1} - {card.title}
                                        </span>
                                    </div>
                                </Marker>
                            ))}
                        </div>
                    )
                ))}

                {/* Popups */}
                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.location!.lng}
                        latitude={popupInfo.location!.lat}
                        onClose={() => setPopupInfo(null)}
                        className="text-black"
                        closeButton={false}
                    >
                        <div className="p-3 min-w-[200px] border-none">
                            <h3 className="font-bold text-sm mb-1">{popupInfo.title}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                {popupInfo.location?.name}
                            </p>
                            {popupInfo.description && (
                                <p className="text-xs bg-slate-100 p-2 rounded text-slate-700">
                                    {popupInfo.description}
                                </p>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}
