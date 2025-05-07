'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ListedValidator, ValidatorFormData, addValidator, updateValidator } from '@/lib/admin/validator-client-services';

// Define validator form schema
const validatorFormSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  provider: z.string().min(1, { message: "Provider is required" }),
  modelName: z.string().min(1, { message: "Model name is required" }),
  active: z.boolean().default(true),
  description: z.string().optional(),
  validatorType: z.string().optional(),
  keyId: z.string().optional(),
});

type ValidatorFormValues = z.infer<typeof validatorFormSchema>;

interface ValidatorFormProps {
  validator?: ListedValidator; // If provided, we're editing
  openRouterModels: { id: string; name: string }[];
  onSuccess: (validator: ListedValidator) => void;
  onCancel: () => void;
}

export default function ValidatorForm({ 
  validator, 
  openRouterModels, 
  onSuccess, 
  onCancel 
}: ValidatorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available providers
  const providers = ["OpenAI", "Anthropic", "Google", "OpenRouter"];
  
  // Initialize form
  const form = useForm<ValidatorFormValues>({
    resolver: zodResolver(validatorFormSchema),
    defaultValues: validator ? {
      name: validator.profileName,
      provider: validator.provider,
      modelName: validator.modelName,
      active: validator.active,
      // description: validator.description, // These would be fetched if needed
      // validatorType: validator.validatorType,
      // keyId: validator.keyId,
    } : {
      name: "",
      provider: "",
      modelName: "",
      active: true,
      description: "",
      validatorType: "model_validator",
      keyId: "",
    },
  });

  // Watch provider field to conditionally render model selection
  const watchProvider = form.watch("provider");
  
  // Handle form submission
  const onSubmit = async (values: ValidatorFormValues) => {
    try {
      setIsSubmitting(true);
      
      let result: ListedValidator;
      if (validator) {
        // Update existing validator
        result = await updateValidator(validator.id, values);
        toast.success("Validator updated successfully");
      } else {
        // Create new validator
        result = await addValidator(values);
        toast.success("Validator added successfully");
      }
      
      onSuccess(result);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save validator");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={isSubmitting ? undefined : onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{validator ? "Edit Validator" : "Add New Validator"}</DialogTitle>
          <DialogDescription>
            {validator 
              ? "Update the validator's details below." 
              : "Enter the details for the new AI model validator."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input
              id="name"
              placeholder="AI Model Validator"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="provider" className="text-sm font-medium">Provider</label>
            <Select
              onValueChange={(value) => form.setValue('provider', value)}
              defaultValue={form.getValues('provider')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(provider => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.provider && (
              <p className="text-sm text-red-500">{form.formState.errors.provider.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="modelName" className="text-sm font-medium">Model</label>
            {watchProvider === "OpenRouter" ? (
              <Select
                onValueChange={(value) => form.setValue('modelName', value)}
                defaultValue={form.getValues('modelName')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OpenRouter model" />
                </SelectTrigger>
                <SelectContent>
                  {openRouterModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="modelName"
                placeholder="Model name"
                {...form.register('modelName')}
              />
            )}
            {form.formState.errors.modelName && (
              <p className="text-sm text-red-500">{form.formState.errors.modelName.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <label htmlFor="active" className="text-sm font-medium">Active</label>
              <div className="text-muted-foreground text-sm">
                Enable this validator for use in the system
              </div>
            </div>
            <Switch
              id="active"
              checked={form.watch('active')}
              onCheckedChange={(checked) => form.setValue('active', checked)}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : validator ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
