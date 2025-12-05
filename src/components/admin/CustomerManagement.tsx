import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import ActionButton from '@/components/ui/ActionButton';
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
import { Plus, Edit, Trash2, Search, Eye, User, Mail, Phone } from 'lucide-react';
import solar from '@solar-icons/react';
import { RiArrowUpDownLine } from '@remixicon/react';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
import { cn } from '@/lib/utils';
import * as yup from 'yup';
import {
  fetchProjects,
  selectAllProjects,
  selectProjectLoading,
} from '@/redux/slices/projectsSlice';
import { UserRole } from '@/common/types/auth.types';
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  clearCustomersError,
  Customer,
  UpdateCustomerData,
} from '@/redux/slices/adminSlice';
import usePermission from '@/hooks/usePermission';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  selectedProjects: string[];
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

// Yup validation schema
const customerValidationSchema = yup.object().shape({
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
  selectedProjects: yup.array().optional()
});

const CustomerManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile();
  const { items: customers, loading, error } = useSelector((state: RootState) => state.admin.customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const projects = useSelector(selectAllProjects);
  const projectsLoading = useSelector(selectProjectLoading);
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    selectedProjects: [],
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Generate avatar initials and color for customers
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

  const handleCustomerCardClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActionSheetOpen(true);
  };

  // Validate form fields using Yup
  const validateForm = async (): Promise<boolean> => {
    try {
      await customerValidationSchema.validate({
        ...formData,
        isEditing: !!editingCustomer
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

  // Check if form is valid for button state
  const isFormValid = (): boolean => {
    const hasRequiredFields = formData.firstName.trim() && 
                             formData.lastName.trim() && 
                             formData.email.trim() && 
                             emailRegex.test(formData.email) &&
                             (!!editingCustomer || formData.password.trim());
    
    const hasValidPassword = !!editingCustomer || formData.password.length >= 6;
    
    return hasRequiredFields && hasValidPassword;
  };

  // Handle input changes with validation
  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear specific field error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };
  useEffect(() => {
    dispatch(fetchCustomers());
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

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearCustomersError());
    }
  }, [error, dispatch, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    try {
      if (editingCustomer) {
        // Update customer
        const { selectedProjects, ...updateData } = formData;
        const updatePayload: UpdateCustomerData = {};
        
        // Only include changed fields
        if (updateData.firstName !== editingCustomer.firstName) updatePayload.firstName = updateData.firstName;
        if (updateData.lastName !== editingCustomer.lastName) updatePayload.lastName = updateData.lastName;
        if (updateData.email !== editingCustomer.email) updatePayload.email = updateData.email;
        if (updateData.phone !== editingCustomer.phone) updatePayload.phone = updateData.phone;
        if (updateData.address !== editingCustomer.address) updatePayload.address = updateData.address;
        updatePayload.projectIds = selectedProjects;
        const result = await dispatch(updateCustomer({ 
          id: editingCustomer.id, 
          data: updatePayload 
        })).unwrap();
        
        toast({
          title: 'Success',
          description: result.message || 'Customer updated successfully',
        });
      } else {
        // Create customer
        const createPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password,
          projectIds: formData.selectedProjects,
        };
        
        const result = await dispatch(createCustomer(createPayload)).unwrap();
        
        toast({
          title: 'Success',
          description: result.message || 'Customer created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', selectedProjects: [] });
      setFormErrors({});
      
      // Refresh customers data to update the UI
      dispatch(fetchCustomers());
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    // Extract project IDs from customer's rojects
    const projectIds = customer.projects?.map(cp => cp.project.id) || [];
    
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      password: '', // Don't populate password when editing
      selectedProjects: projectIds,
    });
    setFormErrors({}); // Clear any existing errors
    setIsDialogOpen(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const result = await dispatch(deleteCustomer(customerId)).unwrap();
      toast({
        title: 'Success',
        description: result.message || 'Customer deleted successfully',
      });
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    }
  };

  let filteredCustomers = customers.filter(
    (customer) =>
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Apply sorting
  if (sortConfig) {
    filteredCustomers = [...filteredCustomers].sort((a, b) => {
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
            placeholder="Search customers..."
            className="w-full rounded-lg border border-input bg-background px-10 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-center md:justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="hidden md:flex items-center gap-2">
            <DialogTrigger asChild>
              {hasPermission('users', 'create') && (
                <ActionButton 
                  variant="primary" 
                  motion="subtle"
                  onClick={() => {
                    setEditingCustomer(null);
                    setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', selectedProjects: [] });
                    setFormErrors({});
                  }}
                  text="Add Customer"
                  leftIcon={<Plus className="h-4 w-4" />}
                />
              )}
            </DialogTrigger>
          </div>
          <DialogContent className="w-5/6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information' : 'Add a new customer to your company'}
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
                
                {!editingCustomer && (
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
                  variant="secondary"
                  motion="subtle"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                  text="Cancel"
                />
                <ActionButton 
                  variant="primary" 
                  motion="subtle" 
                  disabled={loading || !isFormValid()}
                  text={loading ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Mobile and Desktop Views */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading customers...</div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <h4 className="text-muted-foreground">No customers found...</h4>
            </div>
          ) : (
            filteredCustomers.map((customer, index) => {
              const avatarData = getAvatarData(customer.firstName, customer.lastName);
              
              return (
                <GlassCard
                  key={customer.id}
                  variant="clean"
                  className="p-4 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in border border-gray-200 hover:border-gray-300 bg-white shadow-sm"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                  onClick={() => handleCustomerCardClick(customer)}
                >
                  <div className="space-y-3">
                    {/* Customer Name */}
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
                          {customer.firstName} {customer.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm font-normal font-['Poppins']">Customer</p>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-100" />

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700 text-sm font-medium truncate">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-700 text-sm font-medium">{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Projects Section */}
                    {customer.projects && customer.projects.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-gray-600 text-xs font-medium">Projects:</div>
                        <div className="flex flex-wrap gap-1">
                          {customer.projects.slice(0, 3).map((cp, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {cp.project.name}
                            </span>
                          ))}
                          {customer.projects.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{customer.projects.length - 3} more
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
                  <th className="w-12 px-3 border-b border-[#1a2624]/10">
                    {/* Actions column - empty header */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="text-lg">Loading customers...</div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <h4 className="text-muted-foreground">No customers found...</h4>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="h-16 hover:bg-gray-50/50 transition-colors animate-fade-in border-b border-[#1a2624]/10"
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <td className="px-3 max-w-xs">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal truncate">
                            {`${customer.firstName} ${customer.lastName}`}
                          </div>
                          {/* Mobile: Show email under name */}
                          <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none sm:hidden truncate">
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 max-w-xs hidden sm:table-cell">
                        <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight truncate">
                          {customer.email}
                        </div>
                      </td>
                      <td className="px-3 hidden md:table-cell">
                        <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
                          {customer.phone || '-'}
                        </div>
                      </td>
                      <td className="px-3 hidden lg:table-cell">
                        <div className="text-sm">
                          {customer.projects && customer.projects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {customer.projects.map((cp, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {cp.project.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope']">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3">
                        <div className="flex items-center justify-center gap-1">
                          {hasPermission('users', 'update') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="w-6 h-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          {hasPermission('users', 'delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
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
      {hasPermission('users', 'create') && (
        <Button
          variant="default"
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', selectedProjects: [] });
            setFormErrors({});
            setIsDialogOpen(true);
          }}
          className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
        >
          <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
        </Button>
      )}
      {/* Bottom Sheet for Customer Actions */}
      <BottomSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : "Customer Actions"}
      >
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {selectedCustomer && (
                <>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const avatarData = getAvatarData(selectedCustomer.firstName, selectedCustomer.lastName);
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
                      <h3 className="font-semibold text-gray-800">{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
                      <p className="text-sm text-gray-600">Customer</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-700">{selectedCustomer.email}</span>
                    </div>
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-700">{selectedCustomer.phone}</span>
                      </div>
                    )}
                  </div>

                  {selectedCustomer.projects && selectedCustomer.projects.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Projects:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedCustomer.projects.map((cp, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {cp.project.name}
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
            {/* Edit Customer */}
            {hasPermission('users', 'update') && selectedCustomer && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  handleEdit(selectedCustomer);
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit size={20} className="text-blue-600" />
                <span className="text-gray-800 font-medium">Edit Customer</span>
              </button>
            )}

            {/* Delete Customer */}
            {hasPermission('users', 'delete') && selectedCustomer && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  handleDelete(selectedCustomer.id);
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} className="text-red-600" />
                <span className="text-red-600 font-medium">Delete Customer</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

export default CustomerManagement;
