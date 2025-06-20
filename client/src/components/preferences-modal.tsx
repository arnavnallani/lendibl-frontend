import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Save } from 'lucide-react';

const preferencesSchema = z.object({
  preferredCategories: z.array(z.number()).optional(),
  priceRangeMin: z.coerce.number().min(0, "Minimum price must be positive").optional(),
  priceRangeMax: z.coerce.number().min(0, "Maximum price must be positive").optional(),
  preferredLocations: z.array(z.string()).optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.getCategories(),
  });

  const { data: preferences } = useQuery({
    queryKey: ["/api/preferences"],
    queryFn: () => api.getUserPreferences(),
    enabled: isOpen,
  });

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      preferredCategories: [],
      priceRangeMin: 0,
      priceRangeMax: 1000,
      preferredLocations: [],
    },
  });

  // Update form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        preferredCategories: preferences.preferredCategories || [],
        priceRangeMin: preferences.priceRangeMin ? parseFloat(preferences.priceRangeMin) : 0,
        priceRangeMax: preferences.priceRangeMax ? parseFloat(preferences.priceRangeMax) : 1000,
        preferredLocations: preferences.preferredLocations || [],
      });
    }
  }, [preferences, form]);

  const updatePreferencesMutation = useMutation({
    mutationFn: api.updateUserPreferences,
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your preferences have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: PreferencesFormData) => {
    updatePreferencesMutation.mutate({
      ...values,
      priceRange: {
        min: values.priceRangeMin || 0,
        max: values.priceRangeMax || 1000,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recommendation Preferences
          </DialogTitle>
          <DialogDescription>
            Customize your preferences to get better personalized recommendations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Preferred Categories */}
            <FormField
              control={form.control}
              name="preferredCategories"
              render={() => (
                <FormItem>
                  <FormLabel>Preferred Categories</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <FormField
                        key={category.id}
                        control={form.control}
                        name="preferredCategories"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={category.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), category.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== category.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {category.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceRangeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priceRangeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePreferencesMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}