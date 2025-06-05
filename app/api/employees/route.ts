//saving employees to json file can be removed for database
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const employees = await request.json();
    
    // Write to employees.json
    const filePath = path.join(process.cwd(), 'public', 'employees.json');
    fs.writeFileSync(filePath, JSON.stringify(employees, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving employees:', error);
    return NextResponse.json(
      { error: 'Failed to save employees' },
      { status: 500 }
    );
  }
} 