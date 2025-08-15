import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createProject, selectProjectLoading, selectProjectError } from '@/redux/slices/projectsSlice';
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
import { CreateProjectData } from '@/redux/slices/projectsSlice';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: string;
}

interface FormErrors {
  name?: string;
  status?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
}

const PROJECT_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ACTIVE', label: 'Active' },
];

const AddProjectDialog: React.FC<AddProjectDialogProps> = ({ open, onOpenChange }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const loading = useAppSelector(selectProjectLoading);
  const error = useAppSelector(selectProjectError);

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: '',
    startDate: '',
    endDate: '',
    budget: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Reset form when dialog closes
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        status: '',
        startDate: '',
        endDate: '',
        budget: '',
      });
      setFormErrors({});
    }
  }, [open]);

  // Handle form field changes
  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
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
      errors.name = 'Project name is required';
    }

    if (!formData.status) {
      errors.status = 'Project status is required';
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      errors.budget = 'Budget must be a valid number';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      errors.endDate = 'End date must be after start date';
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
      const projectData: Omit<CreateProjectData, 'companyId'> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
      };

      const result = await dispatch(createProject(projectData));
      
      if (createProject.fulfilled.match(result)) {
        toast({
          title: 'Success',
          description: 'Project created successfully',
        });
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done in Redux and will show via error state
    }
  };

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your portfolio. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter project name"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>



            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select project status" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-sm text-red-500">{formErrors.status}</p>
              )}
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Enter budget amount"
                min="0"
                step="0.01"
                className={formErrors.budget ? 'border-red-500' : ''}
              />
              {formErrors.budget && (
                <p className="text-sm text-red-500">{formErrors.budget}</p>
              )}
            </div>



            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={formErrors.startDate ? 'border-red-500' : ''}
              />
              {formErrors.startDate && (
                <p className="text-sm text-red-500">{formErrors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={formErrors.endDate ? 'border-red-500' : ''}
              />
              {formErrors.endDate && (
                <p className="text-sm text-red-500">{formErrors.endDate}</p>
              )}
            </div>





            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter project description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
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
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDialog;