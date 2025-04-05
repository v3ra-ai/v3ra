// app/api/admin/validators/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET() {
  try {
    console.log("Fetching validators from Supabase");
    const validators = await prisma.validator.findMany({
      select: {
        id: true,
        profileName: true,
        provider: true,
        modelName: true,
        active: true,
        apiKeys: {
          select: {
            apiKey: {  // Navigate to ApiKey through ValidatorKey
              select: {
                id: true,
                provider: true
              }
            }
          }
        }
      }
    });
    return NextResponse.json(validators);
  } catch (error) {
    console.error("Error fetching validators:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}