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
import {
  fetchProjects,
  selectAllProjects,
  selectProjectLoading,
} from '@/redux/slices/projectsSlice';
import { fetchRoles, selectAllRoles, selectRolesLoading } from '@/redux/slices/rolesSlice';
import usePermission from '@/hooks/usePermission';
import DeleteMemberModal from './DeleteMemberModal';

interface MemberFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  roleId: string;
  password: string;
  selectedProjects: string[];
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
  const projects = useSelector(selectAllProjects);
  const projectsLoading = useSelector(selectProjectLoading);
  const { items: membersList, loading, error } = members;
  const roles = useSelector(selectAllRoles);
  const rolesLoading = useSelector(selectRolesLoading);
  const { hasPermission } = usePermission();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<MemberFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    roleId: '',
    password: '',
    selectedProjects: [],
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

    if (!formData.roleId) {
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
                             formData.roleId &&
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
    dispatch(fetchProjects());
    dispatch(fetchRoles());
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
        const { password, selectedProjects, ...updateData } = formData;
        const updatePayload: UpdateMemberData = {};
        
        // Only include changed fields
        if (updateData.firstName !== editingMember.firstName) updatePayload.firstName = updateData.firstName;
        if (updateData.lastName !== editingMember.lastName) updatePayload.lastName = updateData.lastName;
        if (updateData.email !== editingMember.email) updatePayload.email = updateData.email;
        if (updateData.phone !== editingMember.phone) updatePayload.phone = updateData.phone;
        if (updateData.address !== editingMember.address) updatePayload.address = updateData.address;
        if (updateData.roleId !== editingMember.role.id) updatePayload.roleId = updateData.roleId;
        updatePayload.projectIds = selectedProjects;
        const result = await dispatch(updateMember({ 
          id: editingMember.id, 
          data: updatePayload 
        })).unwrap();
        
        toast({
          title: 'Success',
          description: result.message || 'Member updated successfully',
        });
      } else {
        // Create member
        const createPayload = {
          ...formData,
           projectIds: formData.selectedProjects,
        };
        
        const result = await dispatch(createMember(createPayload)).unwrap();
        
        toast({
          title: 'Success',
          description: result.message || 'Member created successfully',
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
      roleId: '',
      password: '',
      selectedProjects: [],
    });
    setFormErrors({});
    setEditingMember(null);
  };
  /// Handle project selection
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

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    // Extract project IDs from member's projectMembers
    const projectIds = member.projectMembers?.map(pm => pm.project.id) || [];
    
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone || '',
      address: member.address || '',
      roleId: member.role.id,
      password: '', // Don't populate password for editing
      selectedProjects: projectIds,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = (member: Member) => {
    setDeletingMember(member);
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    
    setIsDeleting(true);
    try {
      const result = await dispatch(deleteMember(deletingMember.id)).unwrap();
      toast({
        title: 'Success',
        description: result.message || 'Member deleted successfully',
      });
      setShowDeleteModal(false);
    } catch (error) {
      // Error handling is done in the Redux slice and useEffect
    } finally {
      setIsDeleting(false);
      setDeletingMember(null);
    }
  };

  const filteredMembers = membersList.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search members..."
            className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
        {hasPermission('users', 'create') && (
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
                    value={formData.roleId}
                    onValueChange={(value) => handleInputChange('roleId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesLoading ? (
                        <SelectItem value="">Loading roles...</SelectItem>
                      ) : roles.length === 0 ? (
                        <SelectItem value="">No roles available</SelectItem>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
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
              <DialogFooter>
                <Button type="submit" disabled={loading || !isFormValid()}>
                  {loading ? 'Saving...' : editingMember ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Projects</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                {(hasPermission('users','update') || hasPermission('users','delete')) && (
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
                  Loading members...
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8">
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
                    <span className="font-medium text-sm">{member.firstName} {member.lastName}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{member.email}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{member.phone || '-'}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{member.role.name}</span>
                  </td>

                  <td className="p-4">
                    <div className="text-sm">
                      {member.projectMembers && member.projectMembers.length > 0 ? (
                        <div className="space-y-1">
                          {member.projectMembers.map((pm, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {pm.project.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No projects</span>
                      )}
                    </div>
                  </td>
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
                      {hasPermission('users','update') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('users','delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member)}
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
    
    {/* Delete Member Modal */}
    <DeleteMemberModal
      open={showDeleteModal}
      onOpenChange={setShowDeleteModal}
      member={deletingMember}
      onConfirm={handleConfirmDelete}
      loading={isDeleting}
    />
  
};

export default MemberManagement;