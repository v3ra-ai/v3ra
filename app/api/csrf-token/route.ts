import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/utils/csrf-utils";

export async function GET() {
  try {
    // Create response without committing JSON yet
    const response = new NextResponse();
    const csrfToken = generateCsrfToken(response);
    // Set JSON body after setting cookie
    return NextResponse.json({ csrfToken }, { status: 200, headers: response.headers });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
}