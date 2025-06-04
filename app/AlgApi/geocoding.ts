import { Coordinates } from '../types';

const GEOCODE_API_KEY = process.env.NEXT_PUBLIC_GEOCODE_API_KEY || '';

export async function geocodeAddress(address: string): Promise<Coordinates> {
  try {
    const response = await fetch(
      `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${GEOCODE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No geocoding results found');
    }

    // Get the first result
    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
} 