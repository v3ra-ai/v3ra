import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Shared admin navigation or header could go here */}
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
