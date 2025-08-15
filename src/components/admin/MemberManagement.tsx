import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
import {
  fetchMembers,
  createMember,
  updateMember,
  deleteMember,
  clearMembersError,
  Member,
  UpdateMemberData,
} from '@/redux/slices/adminSlice';

interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  password: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  password?: string;
}

const MemberManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { members } = useSelector((state: RootState) => state.admin);
  const { items: membersList, loading, error } = members;

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    if (!editingMember && !formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    const hasRequiredFields = formData.firstName.trim() && 
                             formData.lastName.trim() && 
                             formData.email.trim() && 
                             formData.role &&
                             (!!editingMember || formData.password.trim());
    const hasValidEmail = emailRegex.test(formData.email);
    return hasRequiredFields && hasValidEmail;
  };

  const handleInputChange = (field: keyof MemberFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  // Company ID is now handled in Redux thunks

  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
      dispatch(clearMembersError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (editingMember) {
        // Update member (exclude password from update)
        const { password, ...updateData } = formData;
        const updatePayload: UpdateMemberData = {};
        
        // Only include changed fields
        if (updateData.firstName !== editingMember.firstName) updatePayload.firstName = updateData.firstName;
        if (updateData.lastName !== editingMember.lastName) updatePayload.lastName = updateData.lastName;
        if (updateData.email !== editingMember.email) updatePayload.email = updateData.email;
        if (updateData.phone !== editingMember.phone) updatePayload.phone = updateData.phone;
        if (updateData.address !== editingMember.address) updatePayload.address = updateData.address;
        if (updateData.role !== editingMember.role) updatePayload.role = updateData.role;
        
        await dispatch(updateMember({ 
          id: editingMember.id, 
          data: updatePayload 
        })).unwrap();
        
        toast({
          title: 'Success',
          description: 'Member updated successfully',
        });
      } else {
        // Create member
        const createPayload = {
          ...formData,
        };
        
        await dispatch(createMember(createPayload)).unwrap();
        
        toast({
          title: 'Success',
          description: 'Member created successfully',
        });
      }
      
      setFormErrors({});
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      role: '',
      password: '',
    });
    setFormErrors({});
    setEditingMember(null);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      address: member.address || '',
      role: member.role,
      password: '', // Don't populate password for editing
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await dispatch(deleteMember(id)).unwrap();
        toast({
          title: 'Success',
          description: 'Member deleted successfully',
        });
      } catch (error) {
        // Error handling is done in the Redux slice and useEffect
      }
    }
  };

  const filteredMembers = membersList.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMember(null);
              resetForm();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </DialogTitle>
              <DialogDescription>
                {editingMember ? 'Update member information' : 'Add a new member to your company'}
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
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-red-600">{formErrors.role}</p>
                  )}
                </div>
                {!editingMember && (
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
                  {loading ? 'Saving...' : editingMember ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Address</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  Loading members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8">
                  No members found
                </td>
              </tr>
            ) : (
              filteredMembers.map((member, index) => (
                <tr
                  key={member.id}
                  className="border-b last:border-0 hover:bg-secondary/30 transition-colors animate-fade-in"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <td className="p-4">
                    <span className="font-medium">{member.firstName} {member.lastName}</span>
                  </td>
                  <td className="p-4">{member.email}</td>
                  <td className="p-4">{member.phone || '-'}</td>
                  <td className="p-4">{member.address || '-'}</td>
                  <td className="p-4">{member.role}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
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

export default MemberManagement;