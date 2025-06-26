declare global {
  interface Window {
    hj?: (command: string, ...args: any[]) => void;
    _hjSettings?: {
      hjid: number;
      hjsv: number;
    };
    Sentry?: {
      addBreadcrumb: (breadcrumb: {
        category: string;
        message: string;
        level: string;
        data?: any;
      }) => void;
    };
  }
}

export {};