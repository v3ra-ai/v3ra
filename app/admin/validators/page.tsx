import React from 'react';
import { fetchValidators, ListedValidator } from '@/lib/admin/validator-client-services';
import ValidatorListClient from './components/validator-list-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { fetchOpenRouterModels } from '@/lib/services/openrouterService';

export default async function ValidatorManagerPage() {
  let initialValidators: ListedValidator[] = [];
  let error: string | null = null;
  let openRouterModels: { id: string; name: string }[] = [];

  try {
    initialValidators = await fetchValidators();
  } catch (e) {
    console.error("Failed to fetch initial validators:", e);
    error = e instanceof Error ? e.message : "An unknown error occurred while fetching validators.";
  }

  try {
    openRouterModels = await fetchOpenRouterModels();
  } catch (e) {
    console.error("Failed to fetch OpenRouter models:", e);
    // Non-critical error, can proceed without pre-fetched models
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="bg-gray-900 text-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-100">Validator Manager</CardTitle>
          <CardDescription className="text-gray-400">
            Add, edit, and manage your AI model validators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 p-4 border border-red-500/50 bg-red-500/10 rounded-md">
              <p className="font-semibold">Error loading validators:</p>
              <p>{error}</p>
            </div>
          ) : (
            <ValidatorListClient 
              initialValidators={initialValidators} 
              openRouterModels={openRouterModels} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
