'use client';

import React, { useState, useEffect } from 'react';
import { ListedValidator, toggleValidatorActive } from '@/lib/admin/validator-client-services';
import ValidatorForm from './validator-form';
import DeleteDialog from './delete-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ValidatorListClientProps {
  initialValidators: ListedValidator[];
  openRouterModels: { id: string; name: string }[];
}

export default function ValidatorListClient({ initialValidators, openRouterModels }: ValidatorListClientProps) {
  const [validators, setValidators] = useState<ListedValidator[]>(initialValidators);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingValidator, setEditingValidator] = useState<ListedValidator | null>(null);
  const [deletingValidator, setDeletingValidator] = useState<ListedValidator | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Debug initialValidators on mount
  useEffect(() => {
    console.log('Initial Validators:', initialValidators);
    console.log('Validators State:', validators);
  }, [initialValidators, validators]);

  // Handler for the add/edit form submission (handled by the form component)
  const handleValidatorUpdated = (updatedValidator: ListedValidator) => {
    setValidators(prev => {
      const index = prev.findIndex(v => v.id === updatedValidator.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = updatedValidator;
        return updated;
      }
      return [...prev, updatedValidator]; // If new validator
    });
    setEditingValidator(null); // Close edit mode
    setIsAddOpen(false); // Close add form
  };

  // Handler for successful deletion
  const handleValidatorDeleted = (deletedId: string) => {
    setValidators(prev => prev.filter(v => v.id !== deletedId));
    setDeletingValidator(null); // Close delete dialog
  };

  // Handler for toggle active status
  const handleToggleActive = async (validator: ListedValidator) => {
    try {
      setIsLoading(true);
      const newStatus = !validator.active;
      const updated = await toggleValidatorActive(validator.id, newStatus);
      setValidators(prev =>
        prev.map(v => v.id === validator.id ? updated : v)
      );
      toast.success(`Validator ${updated.profileName} is now ${newStatus ? 'active' : 'inactive'}`);
    } catch (error) {
      console.error("Failed to toggle validator status:", error);
      toast.error("Failed to update validator status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">Validators</h2>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Validator
        </Button>
      </div>

      {/* Validators Table */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-gray-800 text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Provider</th>
              <th scope="col" className="px-6 py-3">Model</th>
              <th scope="col" className="px-6 py-3">Active</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {validators.length === 0 ? (
              <tr className="border-b bg-gray-900 border-gray-700">
                <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                  No validators found. Add one to get started.
                </td>
              </tr>
            ) : (
              validators.map(validator => (
                <tr key={validator.id} className="border-b bg-gray-900 border-gray-700 hover:bg-gray-800">
                  <td className="px-6 py-4 font-medium whitespace-nowrap text-white">
                    {validator.profileName || 'Unnamed Validator'}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{validator.provider}</td>
                  <td className="px-6 py-4 text-gray-300">{validator.modelName}</td>
                  <td className="px-6 py-4">
                    <Switch
                      checked={validator.active}
                      disabled={isLoading}
                      onCheckedChange={() => handleToggleActive(validator)}
                    />
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingValidator(validator)}
                      className="text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingValidator(validator)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Form Modal or Drawer */}
      {isAddOpen && (
        <ValidatorForm
          openRouterModels={openRouterModels}
          onSuccess={handleValidatorUpdated}
          onCancel={() => setIsAddOpen(false)}
        />
      )}

      {editingValidator && (
        <ValidatorForm
          validator={editingValidator}
          openRouterModels={openRouterModels}
          onSuccess={handleValidatorUpdated}
          onCancel={() => setEditingValidator(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingValidator && (
        <DeleteDialog
          validator={deletingValidator}
          onConfirmDelete={handleValidatorDeleted}
          onCancel={() => setDeletingValidator(null)}
        />
      )}
    </div>
  );
}