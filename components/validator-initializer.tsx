"use client";

// This component no longer initializes validators on the client side
// Validator initialization should happen server-side only
export function ValidatorInitializer() {
  // Validators are now initialized server-side through API routes
  // This prevents ioredis and other server-only modules from being bundled on the client
  
  console.log("ValidatorInitializer: Client-side initialization disabled for server-only modules");
  
  // This component doesn't render anything
  return null;
}
