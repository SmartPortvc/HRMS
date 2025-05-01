import toast from 'react-hot-toast';

export interface OfficeLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  { name: "AP MARITIME BOARD HEAD OFFICE", latitude: 16.4228036, longitude: 80.562812 },
  { name: "APMB LA KAVALI", latitude: 14.8860989, longitude: 79.985184 },
  { name: "APMB VIZAG DHC", latitude: 17.744005, longitude: 83.312909 },
  { name: "APMB, Mangalagiri", latitude: 16.4962219, longitude: 80.586393 },
  { name: "BPDCL PORT SITE", latitude: 18.5334655, longitude: 84.325332 },
  { name: "Jawahar Jetty - Kakinada", latitude: 16.9396366, longitude: 82.2433 },
  { name: "Juvulladinne FH", latitude: 14.8039829, longitude: 80.07975 },
  { name: "Machilipatnam Port Office", latitude: 16.1856213, longitude: 81.141544 },
  { name: "Marine Division", latitude: 16.9550966, longitude: 82.266864 },
  { name: "MPDCL PORT SITE", latitude: 16.1955344, longitude: 81.147925 },
  { name: "MTP F H", latitude: 16.1754636, longitude: 81.163208 },
  { name: "PO.MTM Tab", latitude: 16.2156543, longitude: 81.207175 },
  { name: "PORT OFFICE RPDCL", latitude: 15.0111129, longitude: 80.04796 },
  { name: "Port Office, Kakinada", latitude: 16.9549063, longitude: 82.266887 },
  { name: "RPDCL PORT SITE", latitude: 15.0111129, longitude: 80.04796 },
  { name: "RR Colony Mondivaripalem", latitude: 15.0486275, longitude: 80.021878 },
  { name: "Sample Test Location", latitude: 16.5061743, longitude: 80.6480153 }
];

const ALLOWED_LAT_RANGE = { min: 15.0000000, max: 17.0000000 };
const ALLOWED_LON_RANGE = { min: 79.0000000, max: 81.0000000 };

function isWithinAllowedRange(latitude: number, longitude: number): boolean {
  return (
    latitude >= ALLOWED_LAT_RANGE.min &&
    latitude <= ALLOWED_LAT_RANGE.max &&
    longitude >= ALLOWED_LON_RANGE.min &&
    longitude <= ALLOWED_LON_RANGE.max
  );
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      reject(new Error('Geolocation not supported'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Please allow location access to mark attendance';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        toast.error(errorMessage);
        reject(new Error(errorMessage));
      },
      options
    );
  });
}

export function findNearestOffice(latitude: number, longitude: number): { office: OfficeLocation | null; distance: number } {
  // First check if the location is within the allowed range
  if (!isWithinAllowedRange(latitude, longitude)) {
    toast.error('You are not within the allowed geographical range');
    return { office: null, distance: Infinity };
  }

  let nearestOffice: OfficeLocation | null = null;
  let shortestDistance = Infinity;

  OFFICE_LOCATIONS.forEach(office => {
    // Only consider offices that are also within the allowed range
    if (isWithinAllowedRange(office.latitude, office.longitude)) {
      const latDiff = Math.abs(latitude - office.latitude);
      const lonDiff = Math.abs(longitude - office.longitude);
      const approximateDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000; // Convert to meters (111km per degree)

      if (approximateDistance < shortestDistance) {
        shortestDistance = approximateDistance;
        nearestOffice = office;
      }
    }
  });

  if (!nearestOffice) {
    toast.error('No valid office locations found in range');
    return { office: null, distance: Infinity };
  }

  return { office: nearestOffice, distance: shortestDistance };
}

export function formatDistance(distance: number): string {
  if (distance === Infinity) {
    return 'Out of range';
  }
  if (distance < 1000) {
    return `${Math.round(distance)} meters`;
  }
  return `${(distance / 1000).toFixed(2)} km`;
}