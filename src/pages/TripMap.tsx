import { useKanban } from "@/contexts/KanbanContext";
import { useState, useMemo } from "react";
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { Card } from "@/types/kanban";
import { format } from "date-fns";
import { Bed, MapPin, Calendar, Navigation, Layers } from "lucide-react";
import { useLocation } from "react-router-dom";
import { TripSettingsDialog } from '@/components/TripSettingsDialog';
import { cn } from "@/lib/utils";

// Define a color palette for days
const DAY_COLORS = [
    "#38bdf8", // sky-400
    "#4ade80", // green-400
    "#facc15", // yellow-400
    "#fb923c", // orange-400
    "#f87171", // red-400
    "#c084fc", // purple-400
    "#f472b6", // pink-400
    "#22d3ee", // cyan-400
];

export default function TripMap() {
    const { cards, trips, currentTripId, dashboards } = useKanban();
    const location = useLocation();
    const [popupInfo, setPopupInfo] = useState<Card | null>(null);
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

    // Dialog states
    const [showTripSettingsDialog, setShowTripSettingsDialog] = useState(false);

    // Get dashboardId from URL
    const searchParams = new URLSearchParams(location.search);
    const dashboardId = searchParams.get('dashboardId');

    const currentTrip = trips.find(t => t.id === currentTripId);
    
    // Filter dashboards for current trip
    const tripDashboards = useMemo(() => {
        return dashboards
            .filter(d => d.tripId === currentTripId)
            .sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeA - timeB;
            });
    }, [dashboards, currentTripId]);

    // Filter cards that have location data AND match dashboardId if present
    const cardsWithLocation = useMemo(() => {
        let filteredCards = cards.filter(card => card.location && card.location.lat && card.location.lng);
        
        if (dashboardId) {
            filteredCards = filteredCards.filter(card => card.dashboardId === dashboardId);
        } else if (currentTripId) {
             const tripDashboardIds = tripDashboards.map(d => d.id);
             filteredCards = filteredCards.filter(card => tripDashboardIds.includes(card.dashboardId));
        }

        return filteredCards;
    }, [cards, dashboardId, currentTripId, tripDashboards]);


    // Get accommodations for these dashboards
    const accommodations = useMemo(() => {
        return tripDashboards
            .filter(d => d.accommodation && d.accommodation.lat && d.accommodation.lng)
            .map(d => ({
                ...d.accommodation!,
                dashboardName: d.name,
                dashboardId: d.id,
                visible: !dashboardId || d.id === dashboardId
            }))
            .filter(h => h.visible);
    }, [tripDashboards, dashboardId]);

    // Separate cards into route cards (with dates) and standalone cards (in groups)
    const routeCards = useMemo(() => {
        return cardsWithLocation.filter(card => card.date && !card.groupId);
    }, [cardsWithLocation]);

    const standaloneCards = useMemo(() => {
        return cardsWithLocation.filter(card => card.groupId);
    }, [cardsWithLocation]);

    // Group cards by Date to create routes
    const routes = useMemo(() => {
        const dates = Array.from(new Set(routeCards.map(c => c.date).filter(Boolean))) as string[];
        dates.sort();

        return dates.map((date, index) => {
            const dayCards = routeCards
                .filter(card => card.date === date)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            if (dayCards.length === 0) return null;

            const coordinates = dayCards.map(card => [card.location!.lng, card.location!.lat]);
            const color = DAY_COLORS[index % DAY_COLORS.length];

            return {
                id: date,
                name: format(new Date(date), 'MMM dd'),
                fullDate: format(new Date(date), 'EEEE, MMMM do'),
                color: color,
                cards: dayCards,
                geojson: {
                    type: 'Feature',
                    properties: { color: color },
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates
                    }
                } as GeoJSON.Feature<GeoJSON.LineString>
            };
        }).filter(Boolean);
    }, [routeCards]);

    // Calculate initial view state (bounds)
    const initialViewState = useMemo(() => {
        const allCards = [...routeCards, ...standaloneCards];
        const allPoints = [
            ...allCards.map(c => c.location!),
            ...accommodations
        ];

        if (allPoints.length === 0) {
            return {
                longitude: -0.1276, // London
                latitude: 51.5072,
                zoom: 12
            };
        }

        const lngs = allPoints.map(p => p.lng);
        const lats = allPoints.map(p => p.lat);
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

        return {
            longitude: centerLng,
            latitude: centerLat,
            zoom: 13
        };
    }, [routeCards, standaloneCards, accommodations]);

    return (
        <div className="flex-1 h-screen w-full relative bg-[#09090b] flex flex-col overflow-hidden">
            
            {/* Map HUD / Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
                
                {/* Top Section */}
                <div className="flex items-start justify-between pointer-events-auto">
                    {/* Itinerary Panel */}
                    {routes.length > 0 && (
                        <div className="glass-panel rounded-2xl p-4 w-72 animate-slide-in">
                            <div className="flex items-center gap-2 mb-4 text-white/80">
                                <Layers className="w-4 h-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">Itinerary</h3>
                            </div>
                            
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                {routes.map(route => route && (
                                    <button
                                        key={route.id}
                                        onClick={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 border border-transparent group",
                                            activeRouteId === route.id 
                                                ? "bg-white/10 border-white/10" 
                                                : "hover:bg-white/5"
                                        )}
                                    >
                                        <div 
                                            className={cn(
                                                "w-2 h-8 rounded-full transition-all duration-300",
                                                activeRouteId === route.id ? "scale-y-100" : "scale-y-50 group-hover:scale-y-75"
                                            )}
                                            style={{ backgroundColor: route.color }}
                                        />
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="text-xs font-bold text-white/90">{route.name}</span>
                                            <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                                                {route.cards.length} stops
                                            </span>
                                        </div>
                                        {activeRouteId === route.id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Map
                key={dashboardId || 'all'}
                mapLib={maplibregl}
                initialViewState={initialViewState}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                attributionControl={false}
            >
                <NavigationControl position="bottom-right" />

                {routes.map((route) => (
                    route && (
                        <div key={route.id}>
                            {/* Route Line - Dim others if one is active */}
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
                                            'line-width': activeRouteId === route.id ? 6 : (activeRouteId ? 2 : 4),
                                            'line-opacity': activeRouteId === route.id ? 1 : (activeRouteId ? 0.2 : 0.8),
                                            'line-blur': activeRouteId === route.id ? 2 : 0
                                        }}
                                    />
                                </Source>
                            )}

                            {/* Markers */}
                            {route.cards.map((card, index) => {
                                const isActive = activeRouteId === null || activeRouteId === route.id;
                                if (!isActive) return null;

                                return (
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
                                            <div className="relative transition-transform duration-300 hover:scale-110">
                                                {card.icon ? (
                                                    <div
                                                        className="bg-[#09090b] p-2 rounded-xl shadow-2xl border transition-all duration-200 text-xl"
                                                        style={{ borderColor: route.color, borderWidth: '2px' }}
                                                    >
                                                        {card.icon}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="bg-[#09090b] p-2 rounded-full shadow-2xl border transition-all duration-200"
                                                        style={{ borderColor: route.color, borderWidth: '2px' }}
                                                    >
                                                        <MapPin className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                                {/* Number Badge */}
                                                <div
                                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#09090b] shadow-md border border-[#09090b]"
                                                    style={{ backgroundColor: route.color }}
                                                >
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </div>
                                    </Marker>
                                );
                            })}
                        </div>
                    )
                ))}

                {/* Accommodations */}
                {accommodations.map((accommodation) => (
                    <Marker
                        key={`accommodation-${accommodation.placeId}`}
                        longitude={accommodation.lng}
                        latitude={accommodation.lat}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation();
                            setPopupInfo({
                                id: `accommodation-${accommodation.placeId}`,
                                title: accommodation.name,
                                location: accommodation,
                                icon: "🏨",
                                description: `Accommodation for ${accommodation.dashboardName}`,
                                createdAt: "",
                            } as unknown as Card);
                        }}
                    >
                        <div className="group relative flex flex-col items-center hover:z-50 cursor-pointer">
                            <div className="relative hover:scale-110 transition-transform">
                                <div
                                    className="bg-[#09090b] p-2 rounded-xl shadow-2xl border border-purple-500/50 text-xl z-20"
                                >
                                    <Bed className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </Marker>
                ))}

                {/* Popups - Styled Glass */}
                {popupInfo && (
                    <Popup
                        anchor="top"
                        longitude={popupInfo.location!.lng}
                        latitude={popupInfo.location!.lat}
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        closeOnClick={false}
                        maxWidth="320px"
                        className="custom-popup"
                    >
                        <div className="bg-[#09090b]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-w-[280px]">
                            {/* Color Bar */}
                            <div
                                className="h-1.5 w-full"
                                style={{
                                    backgroundColor: routes.find(r => r?.cards.some(c => c.id === popupInfo.id))?.color || '#3b82f6'
                                }}
                            />

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl mt-0.5">{popupInfo.icon || <MapPin className="w-6 h-6 text-white/50" />}</div>
                                        <div>
                                            <h3 className="font-bold text-white leading-tight mb-0.5">{popupInfo.title}</h3>
                                            {popupInfo.location?.name && (
                                                <p className="text-xs text-muted-foreground">{popupInfo.location.name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setPopupInfo(null)}
                                        className="text-white/20 hover:text-white transition-colors"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                    </button>
                                </div>

                                {(popupInfo.time || popupInfo.location?.address) && (
                                    <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                                        {popupInfo.time && (
                                            <div className="flex items-center gap-2 text-xs text-white/80">
                                                <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                <span>{popupInfo.time}</span>
                                            </div>
                                        )}
                                        {popupInfo.location?.address && (
                                            <div className="flex items-start gap-2 text-xs text-muted-foreground/80">
                                                <Navigation className="w-3.5 h-3.5 mt-0.5 opacity-50 shrink-0" />
                                                <span className="leading-relaxed">{popupInfo.location.address}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {currentTrip && (
                <TripSettingsDialog
                    open={showTripSettingsDialog}
                    onOpenChange={setShowTripSettingsDialog}
                    trip={currentTrip}
                />
            )}
        </div>
    );
}
