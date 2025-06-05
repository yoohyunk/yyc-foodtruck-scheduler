import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const events = await request.json();
    
    // Write to events.json
    const filePath = path.join(process.cwd(), 'public', 'events.json');
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