import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Contact, CreateContactDto, UpdateContactDto, createContactAsync, updateContactAsync, selectContactsLoading, selectContactsError } from '@/redux/slices/contactsSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  mode: 'add' | 'edit';
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  type: string;
  isFavorite: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const CONTACT_TYPES = [
  { value: 'client', label: 'Client' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'partner', label: 'Partner' },
];

const ContactModal: React.FC<ContactModalProps> = ({ open, onOpenChange, contact, mode }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const loading = useAppSelector(selectContactsLoading);
  const error = useAppSelector(selectContactsError);
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    type: 'client',
    isFavorite: false
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Initialize form data when dialog opens or contact changes
  useEffect(() => {
    if (open && mode === 'edit' && contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        type: contact.type || 'client',
        isFavorite: contact.isFavorite || false,
      });
    } else if (open && mode === 'add') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        type: 'client',
        isFavorite: false,
      });
    }
    
    if (!open) {
      setFormErrors({});
    }
  }, [open, mode, contact]);

  // Handle form field changes
  const handleInputChange = (field: keyof ContactFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'add') {
        const createData: CreateContactDto = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          type: formData.type as 'client' | 'vendor' | 'partner',
          isFavorite: formData.isFavorite
        };
        const result = await dispatch(createContactAsync(createData));
        if (createContactAsync.fulfilled.match(result)) {
          toast({
            title: 'Success',
            description: 'Contact created successfully',
          });
          onOpenChange(false);
        }
      } else if (contact) {
        const updateData: UpdateContactDto = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          type: formData.type as 'client' | 'vendor' | 'partner',
          isFavorite: formData.isFavorite
        };
        const result = await dispatch(updateContactAsync({ id: contact.id, data: updateData }));
        if (updateContactAsync.fulfilled.match(result)) {
          toast({
            title: 'Success',
            description: 'Contact updated successfully',
          });
          onOpenChange(false);
        }
      }
    } catch (error) {
      // Error handling is done in Redux and will show via error state
    }
  };

  // Show error toast when error changes and modal is open
  useEffect(() => {
    if (error && open) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Contact' : 'Edit Contact'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Add a new contact to your address book. Fill in the details below.' 
              : 'Update the contact details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter contact name"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500">{formErrors.phone}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Favorite */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFavorite"
                  checked={formData.isFavorite}
                  onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isFavorite">Mark as Favorite</Label>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading 
                ? (mode === 'add' ? 'Creating...' : 'Updating...') 
                : (mode === 'add' ? 'Create Contact' : 'Update Contact')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactModal;