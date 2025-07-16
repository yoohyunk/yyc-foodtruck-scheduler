import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Try with Alberta restrictions first
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ca&limit=1&addressdetails=1&bounded=1&viewbox=-120.0,49.0,-110.0,60.0&bounded=1`;
    

    
    let response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'YYCFoodTrucks/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();

    // If no results with restrictions, try without them
    if (!data || data.length === 0) {
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;
      
      response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'YYCFoodTrucks/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
    }

    if (data && data.length > 0) {
      const coords = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
      
      return NextResponse.json({
        success: true,
        coordinates: coords,
        address: address, // Return the original address, not the expanded one
        display_name: data[0].display_name, // Keep the expanded name for reference
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Address not found',
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Geocoding failed' 
      },
      { status: 500 }
    );
  }
} 