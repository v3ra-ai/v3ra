"use client";

// This component initializes our validator system and doesn't use hooks to avoid TypeScript issues
export function ValidatorInitializer() {
  // This component uses a direct script execution approach
  if (typeof window !== 'undefined') {
    // Dynamically import and initialize validators
    import('@/lib/validators/init').then(module => {
      console.log('Initializing validators on client-side...');
      module.initializeValidators();
    }).catch(error => {
      console.error('Failed to initialize validators:', error);
    });
  }

  // This component doesn't render anything
  return null;
}
