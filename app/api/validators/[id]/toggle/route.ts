import { NextRequest, NextResponse } from 'next/server';
import * as validators from '../../../../../lib/db/validators';

// POST /api/validators/[id]/toggle - Toggle a validator's active status
export async function POST(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (body.active === undefined) {
      return NextResponse.json(
        { error: 'Missing active status in request body' },
        { status: 400 }
      );
    }
    
    await validators.toggleValidator(id, body.active);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling validator status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle validator status' },
      { status: 500 }
    );
  }
}
