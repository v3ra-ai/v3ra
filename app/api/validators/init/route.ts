import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Initialize validators server-side
    const { initializeValidators } = await import('@/lib/validators/init');
    await initializeValidators();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Validators initialized successfully' 
    });
  } catch (error) {
    console.error('Failed to initialize validators:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize validators',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Validator initialization endpoint. Use POST to initialize.' 
  });
}
