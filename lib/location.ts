// lib/location.ts - SIMPLIFIED VERSION
export interface StateCoordinates {
  name: string;
  capital: string;
  latitude: number;
  longitude: number;
}

export const NIGERIAN_STATE_COORDINATES: StateCoordinates[] = [
  { name: 'Abia', capital: 'Umuahia', latitude: 5.5333, longitude: 7.4833 },
  { name: 'Adamawa', capital: 'Yola', latitude: 9.2300, longitude: 12.4800 },
  { name: 'Akwa Ibom', capital: 'Uyo', latitude: 5.0333, longitude: 7.9167 },
  { name: 'Anambra', capital: 'Awka', latitude: 6.2100, longitude: 7.0700 },
  { name: 'Bauchi', capital: 'Bauchi', latitude: 10.3100, longitude: 9.8400 },
  { name: 'Bayelsa', capital: 'Yenagoa', latitude: 4.9267, longitude: 6.2676 },
  { name: 'Benue', capital: 'Makurdi', latitude: 7.7300, longitude: 8.5400 },
  { name: 'Borno', capital: 'Maiduguri', latitude: 11.8333, longitude: 13.1500 },
  { name: 'Cross River', capital: 'Calabar', latitude: 4.9500, longitude: 8.3250 },
  { name: 'Delta', capital: 'Asaba', latitude: 6.2000, longitude: 6.7300 },
  { name: 'Ebonyi', capital: 'Abakaliki', latitude: 6.3249, longitude: 8.1137 },
  { name: 'Edo', capital: 'Benin City', latitude: 6.3176, longitude: 5.6145 },
  { name: 'Ekiti', capital: 'Ado-Ekiti', latitude: 7.6167, longitude: 5.2167 },
  { name: 'Enugu', capital: 'Enugu', latitude: 6.4500, longitude: 7.5000 },
  { name: 'FCT', capital: 'Abuja', latitude: 9.0765, longitude: 7.3986 },
  { name: 'Gombe', capital: 'Gombe', latitude: 10.2897, longitude: 11.1711 },
  { name: 'Imo', capital: 'Owerri', latitude: 5.4833, longitude: 7.0333 },
  { name: 'Jigawa', capital: 'Dutse', latitude: 11.7592, longitude: 9.3389 },
  { name: 'Kaduna', capital: 'Kaduna', latitude: 10.5264, longitude: 7.4388 },
  { name: 'Kano', capital: 'Kano', latitude: 12.0000, longitude: 8.5167 },
  { name: 'Katsina', capital: 'Katsina', latitude: 12.9889, longitude: 7.6000 },
  { name: 'Kebbi', capital: 'Birnin Kebbi', latitude: 12.4539, longitude: 4.1975 },
  { name: 'Kogi', capital: 'Lokoja', latitude: 7.8022, longitude: 6.7333 },
  { name: 'Kwara', capital: 'Ilorin', latitude: 8.5000, longitude: 4.5500 },
  { name: 'Lagos', capital: 'Ikeja', latitude: 6.6000, longitude: 3.3500 },
  { name: 'Nasarawa', capital: 'Lafia', latitude: 8.4900, longitude: 8.5200 },
  { name: 'Niger', capital: 'Minna', latitude: 9.6139, longitude: 6.5569 },
  { name: 'Ogun', capital: 'Abeokuta', latitude: 7.1500, longitude: 3.3500 },
  { name: 'Ondo', capital: 'Akure', latitude: 7.2500, longitude: 5.1950 },
  { name: 'Osun', capital: 'Oshogbo', latitude: 7.7667, longitude: 4.5667 },
  { name: 'Oyo', capital: 'Ibadan', latitude: 7.3964, longitude: 3.9167 },
  { name: 'Plateau', capital: 'Jos', latitude: 9.9300, longitude: 8.8900 },
  { name: 'Rivers', capital: 'Port Harcourt', latitude: 4.8100, longitude: 7.0100 },
  { name: 'Sokoto', capital: 'Sokoto', latitude: 13.0622, longitude: 5.2339 },
  { name: 'Taraba', capital: 'Jalingo', latitude: 8.9000, longitude: 11.3667 },
  { name: 'Yobe', capital: 'Damaturu', latitude: 11.9667, longitude: 11.7000 },
  { name: 'Zamfara', capital: 'Gusau', latitude: 12.1642, longitude: 6.6667 }
];

// Haversine formula to calculate distance between two coordinates in km
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c); // Distance in km
}

// Get coordinates for a state
export function getStateCoordinates(stateName: string): StateCoordinates | undefined {
  return NIGERIAN_STATE_COORDINATES.find(
    state => state.name.toLowerCase() === stateName.toLowerCase()
  );
}

// Calculate distance between two states
export function getStateDistance(state1: string, state2: string): number | null {
  const coord1 = getStateCoordinates(state1);
  const coord2 = getStateCoordinates(state2);
  
  if (!coord1 || !coord2) return null;
  
  return calculateDistance(
    coord1.latitude,
    coord1.longitude,
    coord2.latitude,
    coord2.longitude
  );
}

// Format distance for display
export function formatDistance(distance: number | null): string {
  if (distance === null) return 'Location not available';
  if (distance === 0) return 'Within your area';
  if (distance < 10) return '< 10 km away';
  if (distance < 50) return `${distance} km away`;
  return `~${distance} km away`;
}

// Get proximity level
export function getProximityLevel(
  userState: string,
  userLGA: string,
  providerState: string,
  providerLGA: string
): 'same-lga' | 'same-state' | 'different-state' {
  if (userState === providerState && userLGA === providerLGA) {
    return 'same-lga';
  } else if (userState === providerState) {
    return 'same-state';
  } else {
    return 'different-state';
  }
}

// Browser geolocation
export async function getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0
      }
    );
  });
}

// SIMPLIFIED VERSION - Just returns null since we'll use database directly in page.tsx
export async function reverseGeocodeToState(
  latitude: number,
  longitude: number
): Promise<{ state: string | null; lga: string | null }> {
  // This function is kept for compatibility but won't be used
  // We'll use the database RPC function directly in page.tsx
  console.log('Reverse geocoding not implemented - using database RPC instead');
  return { state: null, lga: null };
}

// Helper: Format location for display
export function formatLocation(state: string | null, lga: string | null): string {
  if (state && lga) {
    return `${lga}, ${state}`;
  } else if (state) {
    return state;
  } else {
    return 'Location not set';
  }
}

// Helper: Calculate travel time estimate (very rough estimate)
export function estimateTravelTime(distanceKm: number): string {
  if (distanceKm < 5) return '5-10 mins';
  if (distanceKm < 15) return '15-30 mins';
  if (distanceKm < 50) return '30-60 mins';
  if (distanceKm < 100) return '1-2 hours';
  return '2+ hours';
}