import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  clearCustomersError,
  Customer,
  UpdateCustomerData,
} from '@/redux/slices/adminSlice';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
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
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const { toast } = useToast();

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
  }, [dispatch]);

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
        const updatePayload: UpdateCustomerData = {};
        
        // Only include changed fields
        if (formData.firstName !== editingCustomer.firstName) updatePayload.firstName = formData.firstName;
        if (formData.lastName !== editingCustomer.lastName) updatePayload.lastName = formData.lastName;
        if (formData.email !== editingCustomer.email) updatePayload.email = formData.email;
        if (formData.phone !== editingCustomer.phone) updatePayload.phone = formData.phone;
        if (formData.address !== editingCustomer.address) updatePayload.address = formData.address;
        
        await dispatch(updateCustomer({ 
          id: editingCustomer.id, 
          data: updatePayload 
        })).unwrap();
        
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
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
        };
        
        await dispatch(createCustomer(createPayload)).unwrap();
        
        toast({
          title: 'Success',
          description: 'Customer created successfully',
        });
      }
      
      setIsDialogOpen(false);
      setEditingCustomer(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '' });
      setFormErrors({});
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      password: '', // Don't populate password when editing
    });
    setFormErrors({}); // Clear any existing errors
    setIsDialogOpen(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      await dispatch(deleteCustomer(customerId)).unwrap();
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
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
            <Button onClick={() => {
              setEditingCustomer(null);
              setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '' });
              setFormErrors({});
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information' : 'Add a new customer to your company'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
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
                <Button type="submit" disabled={loading || !isFormValid()}>
                  {loading ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Company</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
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
                    <td className="p-4">
                      <span className="font-medium">{`${customer.firstName} ${customer.lastName}`}</span>
                    </td>
                    <td className="p-4">{customer.email}</td>
                    <td className="p-4">{customer.companyName || '-'}</td>
                    <td className="p-4">{customer.phone || '-'}</td>
                    <td className="p-4">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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