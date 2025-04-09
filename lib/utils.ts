import { clsx, type ClassValue } from "clsx"
import { NextResponse } from "next/server";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createErrorResponse(error: unknown, status: number = 500) {
  const message = error instanceof Error ? error.message : "Unknown error occurred";
  const details = error instanceof Error ? error.stack || String(error) : String(error);
  return NextResponse.json({ error: message, details }, { status });
}

