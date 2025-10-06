import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  fetchProjects,
  selectAllProjects,
  selectProjectLoading,
} from '@/redux/slices/projectsSlice';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import TagSelector from '@/components/ui/tag-selector';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
import {
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  clearVendorsError,
  Vendor,
  UpdateVendorData,
} from '@/redux/slices/adminSlice';
import usePermission from '@/hooks/usePermission';

interface VendorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  tags: string[];
  selectedProjects: string[];
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

const VendorManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  const { items: vendors, loading, error } = useSelector((state: RootState) => state.admin.vendors);
  const projects = useSelector(selectAllProjects);
  const projectsLoading = useSelector(selectProjectLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasPermission } = usePermission();
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    tags: [],
    selectedProjects: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const { toast } = useToast();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!editingVendor && !formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    const hasRequiredFields = formData.firstName.trim() && 
                             formData.lastName.trim() && 
                             formData.email.trim() && 
                             (!!editingVendor || formData.password.trim());
    const hasValidEmail = emailRegex.test(formData.email);
    return hasRequiredFields && hasValidEmail;
  };

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };
  useEffect(() => {
    dispatch(fetchVendors());
    dispatch(fetchProjects());
  }, [dispatch]);
  
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

  // Check for redirect from tag creation
  useEffect(() => {
    const locationState = location.state as {
      fromTagCreation?: boolean;
      newTag?: { name: string; id: string };
      formData?: VendorFormData;
    };
    
    if (locationState?.fromTagCreation && locationState?.newTag) {
      // Pre-fill form data if available
      if (locationState.formData) {
        setFormData({
          ...locationState.formData,
          tags: [...new Set([...locationState.formData.tags, locationState.newTag.name])]
        });
      } else {
        // Just add the new tag to empty form
        setFormData(prev => ({
          ...prev,
          tags: [...new Set([...locationState.formData.tags, locationState.newTag.name])],
          selectedProjects: locationState.formData.selectedProjects || []
        }));
      }
      
      // Open the dialog
      setIsDialogOpen(true);
      setEditingVendor(null);
      
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearVendorsError());
    }
  }, [error, dispatch, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingVendor) {
        // Update vendor
        const updatePayload: UpdateVendorData = {};
        const { selectedProjects, ...updateData } = formData;
        // Only include changed fields
        if (updateData.firstName !== editingVendor.firstName) updatePayload.firstName = updateData.firstName;
        if (updateData.lastName !== editingVendor.lastName) updatePayload.lastName = updateData.lastName;
        if (updateData.email !== editingVendor.email) updatePayload.email = updateData.email;
        if (updateData.phone !== editingVendor.phone) updatePayload.phone = updateData.phone;
        if (updateData.address !== editingVendor.address) updatePayload.address = updateData.address;
        if (JSON.stringify(updateData.tags) !== JSON.stringify(editingVendor.tags || [])) {
          updatePayload.tags = updateData.tags;
        }
        updatePayload.projectIds = selectedProjects;
        const result = await dispatch(updateVendor({ 
          id: editingVendor.id, 
          data: updatePayload 
        })).unwrap();
        
        toast({
          title: 'Success',
          description: result.message || 'Vendor updated successfully',
        });
      } else {
        // Create vendor
        const createPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
          tags: formData.tags,
          projectIds: formData.selectedProjects,
        };
        
        const result = await dispatch(createVendor(createPayload)).unwrap();
        
        toast({
          title: 'Success',
          description: result.message || 'Vendor created successfully',
        });
      }
      
      setFormErrors({});
      setIsDialogOpen(false);
      setEditingVendor(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', tags: [] , selectedProjects: []});
      
      // Refresh vendors data to update the UI
      dispatch(fetchVendors());
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    // Extract project IDs from vendor's vendorProjects
    const projectIds = vendor.projects?.map(vp => vp.project.id) || [];
    
    setFormData({
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      email: vendor.email,
      phone: vendor.phone || '',
      address: vendor.address || '',
      password: '', // Don't populate password for editing
      tags: vendor.tags || [],
      selectedProjects: projectIds,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleTagCreated = (tag: any) => {
    // Only redirect for new vendor creation, not updates
    if (!editingVendor) {
      // Store current form data and redirect with new tag
      navigate(location.pathname, {
        state: {
          fromTagCreation: true,
          newTag: { name: tag.name, id: tag.id },
          formData: formData
        }
      });
    } else {
      // For updates, just add the tag without redirect
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, tag.name])]
      }));
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const result = await dispatch(deleteVendor(vendorId)).unwrap();
      toast({
        title: 'Success',
        description: result.message || 'Vendor deleted successfully',
      });
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      `${vendor.firstName} ${vendor.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
        {hasPermission('users', 'create') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingVendor(null);
              setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', tags: [] , selectedProjects: []});
              setFormErrors({});
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="w-5/6 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </DialogTitle>
              <DialogDescription>
                {editingVendor ? 'Update vendor information' : 'Add a new vendor to your company'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-600">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-600">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <TagSelector
                    selectedTags={formData.tags}
                    onTagsChange={(tags) => setFormData({ ...formData, tags })}
                    onTagCreated={handleTagCreated}
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                {!editingVendor && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                    {formErrors.password && (
                      <p className="text-sm text-red-600">{formErrors.password}</p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading || !isFormValid()}>
                  {loading ? 'Saving...' : editingVendor ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>)}
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Name</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground  lg:table-cell">Projects</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground md:table-cell">Tags</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">Status</th>
                {hasPermission('users', 'update') && <th className="text-right p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  Loading vendors...
                </td>
              </tr>
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  No vendors found
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor, index) => (
                <tr
                  key={vendor.id}
                  className="border-b last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <td className="p-2 sm:p-4">
                    <span className="font-medium text-xs sm:text-sm">{vendor.firstName} {vendor.lastName}</span>
                    <div className="text-xs text-muted-foreground sm:hidden mt-1">{vendor.email}</div>
                  </td>
                  <td className="p-2 sm:p-4 hidden sm:table-cell">
                    <span className="text-xs sm:text-sm">{vendor.email}</span>
                  </td>
                  <td className="p-2 sm:p-4 hidden md:table-cell">
                    <span className="text-xs sm:text-sm">{vendor.phone || '-'}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {vendor.projects && vendor.projects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {vendor.projects.map((vp, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {vp.project.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {vendor.tags?.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {!vendor.tags?.length && <span className="text-sm text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      vendor.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission('users', 'update') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(vendor)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('users', 'delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(vendor.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorManagement;