/**
 * Google Maps URL generation utilities
 */

interface Location {
    lat: number;
    lng: number;
    placeId?: string;
}

/**
 * Creates a Google Maps directions URL with multiple waypoints
 * @param locations Array of locations with lat/lng coordinates and optional placeId
 * @returns Google Maps directions URL or null if no locations provided
 */
export function createGoogleMapsRouteUrl(locations: Array<{ lat: number; lng: number; placeId?: string }>): string | null {
    if (!locations || locations.length === 0) {
        return null;
    }

    // Single location - use placeId if available for better display
    if (locations.length === 1) {
        const loc = locations[0];
        if (loc.placeId) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Google')}&query_place_id=${loc.placeId}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${loc.lat}%2C${loc.lng}`;
    }

    // Multiple locations - create a route using coordinates
    // Note: Google Maps Directions API doesn't support place_id format in URLs
    const origin = locations[0];
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(1, -1);

    // Build the URL using coordinates
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat}%2C${origin.lng}&destination=${destination.lat}%2C${destination.lng}`;

    // Add waypoints if there are any
    if (waypoints.length > 0) {
        const waypointsStr = waypoints
            .map(wp => `${wp.lat}%2C${wp.lng}`)
            .join('%7C'); // %7C is the URL-encoded pipe character |
        url += `&waypoints=${waypointsStr}`;
    }

    return url;
}

/**
 * Creates a Google Maps URL to view a single location
 * @param location Location with lat/lng and optional placeId
 * @returns Google Maps location URL
 */
export function createGoogleMapsLocationUrl(location: Location): string {
    // Prefer placeId for more accurate results
    if (location.placeId) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Google')}&query_place_id=${location.placeId}`;
    }

    // Fallback to coordinates
    return `https://www.google.com/maps/search/?api=1&query=${location.lat}%2C${location.lng}`;
}
