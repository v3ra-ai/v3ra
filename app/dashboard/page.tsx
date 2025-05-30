"use client";

import AdminOnly from "@/components/admin-only";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "@/utils/auth-admin-utils";

export default function AdminOnlyExample() {
  const { userEmail } = useAdminAuth();

  return (
    <AdminOnly>
      <Card className="max-w-2xl mx-auto my-6">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">Welcome, {userEmail}!</p>
          <p>
            This content is only visible to admin users with authorized emails.
          </p>
          <p>Here you can add admin-specific features, such as:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Manage users</li>
            <li>View analytics</li>
            <li>Configure settings</li>
          </ul>
        </CardContent>
      </Card>
    </AdminOnly>
  );
}
