import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Contact, CreateContactDto, UpdateContactDto, createContactAsync, updateContactAsync, selectContactsLoading, selectContactsError, clearError, fetchAllContactsByCompany } from '@/redux/slices/contactsSlice';
import { fetchProjects, selectAllProjects, selectProjectLoading } from '@/redux/slices/projectsSlice';
import { fetchTags, Tag } from '@/redux/slices/adminSlice';
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
import TagSelector from '@/components/ui/tag-selector';

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
  type: 'Client' | 'Vendor' | 'Architect';
  isFavorite: boolean;
  selectedProjects: string[];
  tagNames: string[];
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const CONTACT_TYPES = [
  { value: 'Client', label: 'Client' },
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Architect', label: 'Architect' },
];

const ContactModal: React.FC<ContactModalProps> = ({ open, onOpenChange, contact, mode }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const loading = useAppSelector(selectContactsLoading);
  const error = useAppSelector(selectContactsError);
  const projects = useAppSelector(selectAllProjects);
  const projectsLoading = useAppSelector(selectProjectLoading);
  const allTags = useAppSelector((state: any) => state.admin.tags.items);
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    type: 'Client',
    isFavorite: false,
    selectedProjects: [],
    tagNames: [],
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Initialize form data when dialog opens or contact changes
  useEffect(() => {
    if (open) {
      // Fetch projects and tags
      dispatch(fetchProjects());
      dispatch(fetchTags());
      
      if (mode === 'edit' && contact) {
        setFormData({
          name: contact.name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          type: contact.type as 'Client' | 'Vendor' | 'Architect',
          isFavorite: contact.isFavorite || false,
          selectedProjects: [],
          tagNames: contact.tags?.map((tag) => tag.name) || []
        });
      } else if (mode === 'add') {
        setFormData({
          name: '',
          email: '',
          phone: '',
          type: 'Client',
          isFavorite: false,
          selectedProjects: [],
          tagNames: [],
        });
      }
    }
    
    if (!open) {
      setFormErrors({});
    }
  }, [open, mode, contact, dispatch]);

  // Handle form field changes
  const handleInputChange = (field: keyof ContactFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    if (!formData.selectedProjects.includes(projectId)) {
      setFormData(prev => ({
        ...prev,
        selectedProjects: [...prev.selectedProjects, projectId]
      }));
    }
  };

  // Handle project removal
  const handleProjectRemove = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedProjects: prev.selectedProjects.filter(id => id !== projectId)
    }));
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
        // Get tag IDs from tag names
        const tagIds = formData.type === 'Vendor' 
          ? formData.tagNames.map(name => allTags.find(tag => tag.name === name)?.id).filter(Boolean) as string[]
          : undefined;

        const createData: CreateContactDto = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          type: formData.type as 'Client' | 'Vendor' | 'Architect',
          isFavorite: formData.isFavorite,
          projectIds: formData.selectedProjects,
          tagIds: tagIds,
        };
        const result = await dispatch(createContactAsync(createData));
        if (createContactAsync.fulfilled.match(result)) {
          toast({
            title: 'Success',
            description: 'Contact created successfully',
          });
          onOpenChange(false);
          // Refresh contacts after successful creation
          dispatch(fetchAllContactsByCompany({}));
        }
      } else if (contact) {
        // Get tag IDs from tag names
        const tagIds = formData.type === 'Vendor' 
          ? formData.tagNames.map(name => allTags.find(tag => tag.name === name)?.id).filter(Boolean) as string[]
          : undefined;

        const updateData: UpdateContactDto = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          type: formData.type as 'Client' | 'Vendor' | 'Architect',
          isFavorite: formData.isFavorite,
          tagIds: tagIds,
        };
        const result = await dispatch(updateContactAsync({ id: contact.id, data: updateData }));
        if (updateContactAsync.fulfilled.match(result)) {
          toast({
            title: 'Success',
            description: 'Contact updated successfully',
          });
          onOpenChange(false);
          // Refresh contacts after successful update
          dispatch(fetchAllContactsByCompany({}));
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
      // Clear error after displaying
      dispatch(clearError());
    }
  }, [error, toast, open, dispatch]);

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


            {/* Associated Projects */}
            <div className="space-y-2">
              <Label>Associated Projects</Label>
              
              {/* Selected Projects Tags */}
              {formData.selectedProjects.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.selectedProjects.map((projectId) => {
                    const project = projects.find(p => p.id === projectId);
                    return (
                      <div
                        key={projectId}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                      >
                        {project?.title || 'Unknown Project'}
                        <button
                          type="button"
                          onClick={() => handleProjectRemove(projectId)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Project Selection Dropdown */}
              <Select 
                onValueChange={handleProjectSelect}
                disabled={projectsLoading}
                value=""
              >
                <SelectTrigger>
                  <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Add project"} />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter(project => !formData.selectedProjects.includes(project.id))
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags - show only for vendor type */}
            {formData.type === 'Vendor' && (
              <div className="space-y-2 md:col-span-2">
                <Label>Vendor Tags</Label>
                
                {/* Display current tags as badges */}
                {mode === 'edit' && contact && ( contact.type === 'vendor') && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {contact.tags?.map((tag) => (
                      <div
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm"
                      >
                        {tag.name}
                      </div>
                    ))}
                    {contact.vendorTags?.map((tag) => (
                      <div
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm"
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
                
                <TagSelector
                  selectedTags={formData.tagNames}
                  onTagsChange={(tags) => handleInputChange('tagNames', tags)}
                />
              </div>
            )}

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