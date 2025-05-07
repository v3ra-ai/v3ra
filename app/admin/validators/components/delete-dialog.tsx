'use client';

import React, { useState } from 'react';
import { ListedValidator } from '@/lib/admin/validator-client-services';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface DeleteDialogProps {
  validator: ListedValidator;
  onConfirmDelete: (validatorId: string) => void;
  onCancel: () => void;
}

export default function DeleteDialog({ validator, onConfirmDelete, onCancel }: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      console.log("Starting delete for validator:", validator);
      setIsDeleting(true);

      // Create direct fetch for better debugging
      const response = await fetch(`/api/admin/validators/${validator.id}`, {
        method: "DELETE",
      });

      console.log("Delete response:", response.status, response.statusText);

      if (!response.ok) {
        const data = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Delete success:", data);

      toast.success(`Validator "${validator.profileName}" deleted successfully`);
      onConfirmDelete(validator.id);
    } catch (error) {
      console.error("Failed to delete validator:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete validator");
      // Keep dialog open on error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={isDeleting ? undefined : onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Validator</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the validator &quot;{validator.profileName}&quot;?
            <br />
            <span className="font-semibold text-destructive">This action cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
