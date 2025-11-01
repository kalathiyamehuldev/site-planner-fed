import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import ActionButton from '@/components/ui/ActionButton';
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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
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

const CustomerManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: customers, loading, error } = useSelector((state: RootState) => state.admin.customers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate form fields
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

    if (!editingCustomer && !formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (!editingCustomer && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

    if (!validateForm()) {
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

  const filteredCustomers = customers.filter(
    (customer) =>
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                    <Label htmlFor="firstName">First Name *</Label>
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
                    <Label htmlFor="lastName">Last Name *</Label>
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
                  <Label htmlFor="email">Email *</Label>
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
                {!editingCustomer && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
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
                  text={loading ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Name</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="text-left p-2 sm:p-4 font-medium text-xs sm:text-sm text-muted-foreground">Projects</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                {(hasPermission('users', 'update') || hasPermission('users', 'delete')) && <th className="text-right p-2 sm:p-4 font-medium text-xs sm:text-sm  text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="border-b last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <td className="p-2 sm:p-4">
                      <span className="font-medium text-xs sm:text-sm">{`${customer.firstName} ${customer.lastName}`}</span>
                      <div className="text-xs text-muted-foreground sm:hidden mt-1">{customer.email}</div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm">{customer.email}</span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm">{customer.phone || '-'}</span>
                    </td>
                    <td className="p-4">
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
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission('users', 'update') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('users', 'delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
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

export default CustomerManagement;