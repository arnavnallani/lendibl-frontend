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

const editItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "Price must be a non-negative number"),
  categoryId: z.number().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  images: z.array(z.string()).default([]),
  included: z.array(z.string()).default([]),
  available: z.boolean().default(true),
});

type EditItemFormData = z.infer<typeof editItemSchema>;

interface EditItemModalProps {
  item: ItemWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated?: () => void;
}

export default function EditItemModal({ item, isOpen, onClose, onItemUpdated }: EditItemModalProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  
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
      images: [],
      included: [],
      available: true,
    },
  });

  // Reset form and images when item changes
  React.useEffect(() => {
    if (item) {
      setImageUrls(item.images || []);
      form.reset({
        title: item.title,
        description: item.description,
        price: item.price.toString(),
        categoryId: item.categoryId,
        location: item.location,
        images: item.images || [],
        included: item.included || [],
        available: item.available,
      });
    }
  }, [item, form]);

  const onSubmit = async (values: EditItemFormData) => {
    if (!item) return;
    
    try {
      await api.updateItem(item.id, {
        ...values,
        price: parseFloat(values.price),
        images: imageUrls,
      });
      onClose();
      onItemUpdated?.();
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const addImage = () => {
    if (newImageUrl && !imageUrls.includes(newImageUrl)) {
      setImageUrls([...imageUrls, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
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
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            
            {/* Image Management Section */}
            <div className="space-y-4 border-2 border-blue-200 p-4 rounded-lg bg-blue-50">
              <FormLabel className="text-lg font-semibold text-blue-700">Manage Photos</FormLabel>
              
              {/* Current Images Display */}
              <div className="text-sm text-gray-600 mb-2">
                Current photos: {imageUrls.length}
              </div>
              {imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {imageUrls.map((url, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <img 
                          src={url} 
                          alt={`Item photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p>No photos yet. Add some photos to make your listing more attractive!</p>
                </div>
              )}
              
              {/* Add New Image */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter image URL (e.g., from Unsplash)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImage}
                  disabled={!newImageUrl}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Add high-quality photos to attract more renters. You can use image URLs from sites like Unsplash.
              </p>
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