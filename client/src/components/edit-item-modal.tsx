import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ItemWithDetails } from '@shared/schema';
import { ImageUpload } from '@/components/image-upload';

const editItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required'),
  categoryId: z.number().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'), // Keep for backward compatibility
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid zip code is required'),
  images: z.array(z.string()).default([]),
  included: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemModalProps {
  item: ItemWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated?: () => void;
}

export default function EditItemModal({ item, isOpen, onClose, onItemUpdated }: EditItemModalProps) {
  const [images, setImages] = useState<string[]>([]);
  
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => api.getCategories(),
  });

  const form = useForm<EditItemFormData>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      categoryId: 1,
      location: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      images: [],
      included: [],
      available: true,
    },
  });

  // Reset form and images when item changes
  React.useEffect(() => {
    if (item) {
      setImages(item.images || []);
      
      // Parse existing location into separate fields if available
      const locationParts = item.location.split(',').map(part => part.trim());
      const address = locationParts[0] || '';
      const city = locationParts[1] || '';
      const stateZip = locationParts[2] || '';
      const stateZipParts = stateZip.split(' ');
      const state = stateZipParts[0] || '';
      const zipCode = stateZipParts[1] || '';
      
      form.reset({
        title: item.title,
        description: item.description,
        price: item.price.toString(),
        categoryId: item.categoryId,
        location: item.location,
        address: address,
        city: city,
        state: state,
        zipCode: zipCode,
        images: item.images || [],
        included: item.included || [],
        available: item.available ?? true,
      });
    }
  }, [item, form]);

  const onSubmit = async (values: EditItemFormData) => {
    if (!item) return;
    
    // Combine address fields into location for backward compatibility
    const fullAddress = `${values.address}, ${values.city}, ${values.state} ${values.zipCode}`;
    
    try {
      await api.updateItem(item.id, {
        ...values,
        price: values.price.toString(),
        location: fullAddress,
        images: images,
      });
      onClose();
      onItemUpdated?.();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleDelete = async () => {
    if (!item) return;
    
    try {
      await api.deleteItem(item.id);
      onClose();
      onItemUpdated?.();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per day</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Address Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 94105" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="included"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's Included</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter what's included (one item per line)&#10;Example:&#10;Extra battery&#10;Memory card&#10;Carrying case"
                      value={field.value?.join('\n') || ''}
                      onChange={(e) => {
                        const items = e.target.value.split('\n').filter(item => item.trim() !== '');
                        field.onChange(items);
                      }}
                      className="min-h-[100px]"
                      style={{ whiteSpace: 'pre-wrap' }}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">Enter each item on a new line</p>
                </FormItem>
              )}
            />
            
            {/* Image Upload Section */}
            <div className="space-y-4">
              <FormLabel className="text-lg font-semibold">Photos</FormLabel>
              <ImageUpload
                images={images}
                onImagesChange={handleImagesChange}
                maxImages={5}
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Listing
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this listing? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}