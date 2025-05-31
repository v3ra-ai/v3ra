/**
 * Type declarations for New Relic Browser's NREUM object.
 */

interface NREUM {
  recordCustomEvent: (eventType: string, attributes: Record<string, string | number | boolean>) => void;
  // Add other NREUM methods as needed
}

interface Window {
  NREUM?: NREUM;
}