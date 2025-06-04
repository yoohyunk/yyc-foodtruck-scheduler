import { geocodeAddress } from './geocoding';
import { Coordinates } from '../types';

export async function updateCoordinates(address: string): Promise<Coordinates> {
  try {
    const coordinates = await geocodeAddress(address);
    return coordinates;
  } catch (error) {
    console.error('Error updating coordinates:', error);
    throw error;
  }
}

export function formatAddress(address: string): string {
  // Add ", Calgary, AB" if not already present
  if (!address.toLowerCase().includes('calgary')) {
    return `${address}, Calgary, AB`;
  }
  return address;
} 