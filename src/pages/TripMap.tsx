import { useKanban } from "@/contexts/KanbanContext";
import { useState, useMemo, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { Card } from "@/types/kanban";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { NewTripDialog } from '@/components/NewTripDialog';
import { TripSettingsDialog } from '@/components/TripSettingsDialog';
import { AccountSettingsDialog } from '@/components/AccountSettingsDialog';

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
    const { cards, trips, currentTripId, setCurrentTripId, dashboards } = useKanban();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [popupInfo, setPopupInfo] = useState<Card | null>(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

    // Dialog states
    const [showNewTripDialog, setShowNewTripDialog] = useState(false);
    const [showTripSettingsDialog, setShowTripSettingsDialog] = useState(false);
    const [showAccountSettingsDialog, setShowAccountSettingsDialog] = useState(false);

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
             // If no specific dashboard selected, show all for current trip
             // We need to ensure we only show cards for the current trip's dashboards
             const tripDashboardIds = tripDashboards.map(d => d.id);
             filteredCards = filteredCards.filter(card => tripDashboardIds.includes(card.dashboardId));
        }

        return filteredCards;
    }, [cards, dashboardId, currentTripId, tripDashboards]);

    // Separate cards into route cards (with dates) and standalone cards (in groups)
    const routeCards = useMemo(() => {
        return cardsWithLocation.filter(card => card.date && !card.groupId);
    }, [cardsWithLocation]);

    const standaloneCards = useMemo(() => {
        return cardsWithLocation.filter(card => card.groupId);
    }, [cardsWithLocation]);

    // Group cards by Date to create routes
    const routes = useMemo(() => {
        // Get unique dates from route cards only
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
    }, [routeCards]);

    // Calculate initial view state (bounds)
    const initialViewState = useMemo(() => {
        const allCards = [...routeCards, ...standaloneCards];
        if (allCards.length === 0) {
            return {
                longitude: -58.3816, // Buenos Aires fallback (based on user context :) or London -0.1276
                latitude: -34.6037,
                zoom: 12
            };
        }

        const lngs = allCards.map(c => c.location!.lng);
        const lats = allCards.map(c => c.location!.lat);
        const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
        const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;

        return {
            longitude: centerLng,
            latitude: centerLat,
            zoom: 13
        };
    }, [routeCards, standaloneCards]); // Re-calculate when cards change (e.g. dashboard filter changes)

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                isExpanded={isSidebarExpanded}
                toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
                trips={trips}
                dashboards={dashboards}
                currentTripId={currentTripId}
                setCurrentTripId={setCurrentTripId}
                user={user}
                logout={logout}
                onOpenAccountSettings={() => setShowAccountSettingsDialog(true)}
                onOpenNewTrip={() => setShowNewTripDialog(true)}
            />

            <div className="flex-1 h-screen w-full relative bg-[#1a1a1a] flex flex-col">
                {/* Header / Nav Overlay - simplified for Map view */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 pointer-events-none">
                    <div className="pointer-events-auto">
                         {/* Legend */}
                        {routes.length > 0 && (
                            <div className="bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 shadow-xl max-w-[250px]">
                                <h4 className="text-sm font-semibold text-white mb-3">Itinerary {dashboardId && `(${tripDashboards.find(d => d.id === dashboardId)?.name})`}</h4>
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
                </div>

                <Map
                    key={dashboardId || 'all'} // Force re-mount when dashboard changes to reset view
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
                                            <div className="relative">
                                                {card.icon ? (
                                                    <div
                                                        className="bg-white p-2.5 rounded-full shadow-xl border-3 transition-all duration-200 group-hover:scale-110 group-hover:shadow-2xl text-2xl"
                                                        style={{ borderColor: route.color, borderWidth: '3px' }}
                                                    >
                                                        {card.icon}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="bg-white p-2 rounded-full shadow-xl border-3 transition-all duration-200 group-hover:scale-110 group-hover:shadow-2xl"
                                                        style={{ borderColor: route.color, borderWidth: '3px' }}
                                                    >
                                                        <MapPin className="w-5 h-5 text-black" fill={route.color} />
                                                    </div>
                                                )}
                                                {/* Number Badge */}
                                                <div
                                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md border-2 border-white"
                                                    style={{ backgroundColor: route.color }}
                                                >
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </div>
                                    </Marker>
                                ))}
                            </div>
                        )
                    ))}

                    {/* Standalone Points (Group Cards) */}
                    {standaloneCards.map((card) => (
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
                                <div className="relative">
                                    {card.icon ? (
                                        <div
                                            className="bg-white p-2.5 rounded-full shadow-xl border-3 transition-all duration-200 group-hover:scale-110 group-hover:shadow-2xl text-2xl opacity-70"
                                            style={{ borderColor: '#6b7280', borderWidth: '3px', borderStyle: 'dashed' }}
                                        >
                                            {card.icon}
                                        </div>
                                    ) : (
                                        <div
                                            className="bg-white p-2 rounded-full shadow-xl border-3 transition-all duration-200 group-hover:scale-110 group-hover:shadow-2xl opacity-70"
                                            style={{ borderColor: '#6b7280', borderWidth: '3px', borderStyle: 'dashed' }}
                                        >
                                            <MapPin className="w-5 h-5 text-gray-500" fill="#6b7280" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Marker>
                    ))}

                    {/* Popups */}
                    {popupInfo && (
                        <Popup
                            anchor="top"
                            longitude={popupInfo.location!.lng}
                            latitude={popupInfo.location!.lat}
                            onClose={() => setPopupInfo(null)}
                            closeButton={true}
                            closeOnClick={false}
                            maxWidth="360px"
                        >
                            <div className="relative overflow-hidden">
                                {/* Color accent bar */}
                                <div
                                    className="absolute top-0 left-0 right-0 h-1"
                                    style={{
                                        backgroundColor: routes.find(r => r?.cards.some(c => c.id === popupInfo.id))?.color || '#3b82f6'
                                    }}
                                />

                                <div className="p-4 pt-5">
                                    {/* Header with icon and title */}
                                    <div className="flex items-start gap-3 mb-3">
                                        {popupInfo.icon ? (
                                            <div className="text-3xl shrink-0 mt-0.5">
                                                {popupInfo.icon}
                                            </div>
                                        ) : (
                                            <div
                                                className="p-2 rounded-lg shrink-0"
                                                style={{
                                                    backgroundColor: routes.find(r => r?.cards.some(c => c.id === popupInfo.id))?.color + '20' || '#3b82f620'
                                                }}
                                            >
                                                <MapPin
                                                    className="w-5 h-5"
                                                    style={{
                                                        color: routes.find(r => r?.cards.some(c => c.id === popupInfo.id))?.color || '#3b82f6'
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-base mb-1 text-gray-900 leading-tight">
                                                {popupInfo.title}
                                            </h3>
                                            {popupInfo.time && (
                                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                    {popupInfo.time}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Location info */}
                                    <div className="space-y-2">
                                        {/* Location name */}
                                        {popupInfo.location?.name && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                                <p className="text-sm font-medium text-gray-700 leading-snug">
                                                    {popupInfo.location.name}
                                                </p>
                                            </div>
                                        )}

                                        {/* Full address */}
                                        {popupInfo.location?.address && (
                                            <div className="pl-6">
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    {popupInfo.location.address}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {popupInfo.description && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {popupInfo.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>

            <NewTripDialog
                open={showNewTripDialog}
                onOpenChange={setShowNewTripDialog}
            />

            {currentTrip && (
                <>
                    <TripSettingsDialog
                        open={showTripSettingsDialog}
                        onOpenChange={setShowTripSettingsDialog}
                        trip={currentTrip}
                    />
                    {/* Add other dialogs if needed, like ShareTripDialog */}
                </>
            )}
             <AccountSettingsDialog
                open={showAccountSettingsDialog}
                onOpenChange={setShowAccountSettingsDialog}
            />
        </div>
    );
}
