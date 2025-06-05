//saving event to json can be removed after database connectivity
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const events = await request.json();
    
    // Ensure the public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write to events.json
    const filePath = path.join(publicDir, 'events.json');
    
    // If file doesn't exist, create it with an empty array
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
    
    // Write the updated events
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving events:', error);
    return NextResponse.json(
      { error: 'Failed to save events' },
      { status: 500 }
    );
  }
} 