import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import ActionButton from '@/components/ui/ActionButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from "@/components/ui/glass-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Plus, Edit, Trash2, Search, Eye, User, Mail, Phone, Tag } from 'lucide-react';
import { RiArrowUpDownLine } from '@remixicon/react';
import TagSelector from '@/components/ui/tag-selector';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
import { cn } from '@/lib/utils';
import * as yup from 'yup';
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

// Yup validation schema
const vendorValidationSchema = yup.object().shape({
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Please enter a valid email address'),
  phone: yup.string().optional(),
  address: yup.string().optional(),
  password: yup.string().when('isEditing', {
    is: false,
    then: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
    otherwise: (schema) => schema.optional()
  }),
  tags: yup.array().optional(),
  selectedProjects: yup.array().optional()
});

const VendorManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { items: vendors, loading, error } = useSelector((state: RootState) => state.admin.vendors);
  const projects = useSelector(selectAllProjects);
  const projectsLoading = useSelector(selectProjectLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasPermission } = usePermission();
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
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
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Generate avatar initials and color for vendors
  const getAvatarData = (firstName: string, lastName: string) => {
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    
    // Color palette from design system
    const colors = [
      '#1B78F9', '#00C2FF', '#3DD598', '#FFB547', '#FF6B6B',
      '#A970FF', '#FF82D2', '#29C499', '#E89F3D', '#2F95D8'
    ];

    // Generate consistent color based on name
    const name = `${firstName} ${lastName}`;
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

    return {
      initials,
      color: colors[colorIndex],
      bgColor: `${colors[colorIndex]}1A` // 10% opacity
    };
  };

  const handleVendorCardClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setActionSheetOpen(true);
  };

  const validateForm = async (): Promise<boolean> => {
    try {
      await vendorValidationSchema.validate({
        ...formData,
        isEditing: !!editingVendor
      }, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path as keyof FormErrors] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
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

    const isValid = await validateForm();
    if (!isValid) {
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

  let filteredVendors = vendors.filter(
    (vendor) =>
      `${vendor.firstName} ${vendor.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Apply sorting
  if (sortConfig) {
    filteredVendors = [...filteredVendors].sort((a, b) => {
      let aValue = '';
      let bValue = '';
      switch (sortConfig.key) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'phone':
          aValue = a.phone?.toLowerCase() || '';
          bValue = b.phone?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.isActive ? 'active' : 'inactive';
          bValue = b.isActive ? 'active' : 'inactive';
          break;
        default:
          return 0;
      }
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className={cn("space-y-4", isMobile && "bg-transparent")}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full rounded-lg border border-input bg-background px-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
        {hasPermission('users', 'create') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <ActionButton 
              variant="primary" 
              motion="subtle"
              onClick={() => {
                setEditingVendor(null);
                setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', tags: [] , selectedProjects: []});
                setFormErrors({});
              }}
              text="Add Vendor"
              leftIcon={<Plus className="h-4 w-4" />}
            />
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
                    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={formErrors.firstName ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={formErrors.lastName ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-500">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={formErrors.email ? 'border-red-500' : ''}
                    required
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
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
                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={formErrors.password ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.password && (
                      <p className="text-sm text-red-500">{formErrors.password}</p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <ActionButton 
                  variant="primary" 
                  motion="subtle" 
                  disabled={loading || !isFormValid()}
                  text={loading ? 'Saving...' : editingVendor ? 'Update' : 'Create'}
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>)}
        </div>
      </div>

      {/* Mobile and Desktop Views */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading vendors...</div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <h4 className="text-muted-foreground">No vendors found...</h4>
            </div>
          ) : (
            filteredVendors.map((vendor, index) => {
              const avatarData = getAvatarData(vendor.firstName, vendor.lastName);
              
              return (
                <GlassCard
                  key={vendor.id}
                  variant="clean"
                  className="p-4 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in border border-gray-200 hover:border-gray-300 bg-white shadow-sm"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                  onClick={() => handleVendorCardClick(vendor)}
                >
                  <div className="space-y-3">
                    {/* Vendor Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: avatarData.bgColor,
                          color: avatarData.color
                        }}
                      >
                        {avatarData.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-800 text-base font-semibold font-['Poppins'] line-clamp-1">
                          {vendor.firstName} {vendor.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm font-normal font-['Poppins']">Vendor</p>
                      </div>
                    </div>

                    {/* Tags Section */}
                    {vendor.tags && vendor.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {vendor.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {vendor.tags.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            +{vendor.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Separator */}
                    <div className="border-t border-gray-100" />

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700 text-sm font-medium truncate">{vendor.email}</span>
                      </div>
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-700 text-sm font-medium">{vendor.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Projects Section */}
                    {vendor.projects && vendor.projects.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-gray-600 text-xs font-medium">Projects:</div>
                        <div className="flex flex-wrap gap-1">
                          {vendor.projects.slice(0, 3).map((vp, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {vp.project.name}
                            </span>
                          ))}
                          {vendor.projects.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{vendor.projects.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="w-full bg-white rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] lg:table-fixed">
              <thead className="h-12">
                <tr className="border-b border-[#1a2624]/10">
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-full sm:w-1/3 md:w-1/4 lg:w-2/5">
                    <button
                      onClick={() => handleSort('name')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Name
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-full sm:w-1/4 md:w-1/6 lg:w-1/4 hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('email')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Email
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-20 sm:w-24 md:w-28 hidden md:table-cell">
                    <button
                      onClick={() => handleSort('phone')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Phone
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-24 sm:w-28 md:w-32 hidden lg:table-cell">
                    Projects
                  </th>
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-20 sm:w-24 md:w-28 hidden md:table-cell">
                    Tags
                  </th>
                  <th className="w-12 px-3 border-b border-[#1a2624]/10">
                    {/* Actions column - empty header */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="text-lg">Loading vendors...</div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <h4 className="text-muted-foreground">No vendors found...</h4>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor, index) => (
                  <tr
                    key={vendor.id}
                    className="h-16 hover:bg-gray-50/50 transition-colors animate-fade-in border-b border-[#1a2624]/10"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <td className="px-3 max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal truncate">
                          {vendor.firstName} {vendor.lastName}
                        </div>
                        {/* Mobile: Show email under name */}
                        <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none sm:hidden truncate">
                          {vendor.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 max-w-xs hidden sm:table-cell">
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight truncate">
                        {vendor.email}
                      </div>
                    </td>
                    <td className="px-3 hidden md:table-cell">
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
                        {vendor.phone || '-'}
                      </div>
                    </td>
                    <td className="px-3 hidden lg:table-cell">
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
                          <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope']">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {vendor.tags?.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {!vendor.tags?.length && <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope']">-</span>}
                      </div>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('users', 'update') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vendor)}
                            className="w-6 h-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {hasPermission('users', 'delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(vendor.id)}
                            className="w-6 h-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
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
      )}
      {/* Bottom Sheet for Vendor Actions */}
      <BottomSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title={selectedVendor ? `${selectedVendor.firstName} ${selectedVendor.lastName}` : "Vendor Actions"}
      >
        <div className="space-y-4">
          {/* Vendor Details */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {selectedVendor && (
                <>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const avatarData = getAvatarData(selectedVendor.firstName, selectedVendor.lastName);
                      return (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{
                            backgroundColor: avatarData.bgColor,
                            color: avatarData.color
                          }}
                        >
                          {avatarData.initials}
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedVendor.firstName} {selectedVendor.lastName}</h3>
                      <p className="text-sm text-gray-600">Vendor</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-700">{selectedVendor.email}</span>
                    </div>
                    {selectedVendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-700">{selectedVendor.phone}</span>
                      </div>
                    )}
                  </div>

                  {selectedVendor.tags && selectedVendor.tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Tags:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedVendor.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVendor.projects && selectedVendor.projects.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Projects:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedVendor.projects.map((vp, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {vp.project.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Edit Vendor */}
            {hasPermission('users', 'update') && selectedVendor && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  handleEdit(selectedVendor);
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit size={20} className="text-blue-600" />
                <span className="text-gray-800 font-medium">Edit Vendor</span>
              </button>
            )}

            {/* Delete Vendor */}
            {hasPermission('users', 'delete') && selectedVendor && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  handleDelete(selectedVendor.id);
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} className="text-red-600" />
                <span className="text-red-600 font-medium">Delete Vendor</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default VendorManagement;