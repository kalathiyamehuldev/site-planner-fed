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
  projectIds: string[];
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
    projectIds: [],
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
        const { password, projectIds, ...updateData } = formData;
        const updatePayload: UpdateMemberData = {};
        
        // Only include changed fields
        if (updateData.firstName !== editingMember.firstName) updatePayload.firstName = updateData.firstName;
        if (updateData.lastName !== editingMember.lastName) updatePayload.lastName = updateData.lastName;
        if (updateData.email !== editingMember.email) updatePayload.email = updateData.email;
        if (updateData.phone !== editingMember.phone) updatePayload.phone = updateData.phone;
        if (updateData.address !== editingMember.address) updatePayload.address = updateData.address;
        if (updateData.roleId !== editingMember.role.id) updatePayload.roleId = updateData.roleId;
        updatePayload.projectIds = projectIds;
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
           projectIds: formData.projectIds,
        };
        
        const result = await dispatch(createMember(createPayload)).unwrap();
        // Refresh vendors data to update the UI
        dispatch(fetchMembers());
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
      projectIds: [],
    });
    setFormErrors({});
    setEditingMember(null);
  };
  /// Handle project selection
  const handleProjectSelect = (projectId: string) => {
    if (!formData.projectIds.includes(projectId)) {
      setFormData(prev => ({
        ...prev,
        projectIds: [...prev.projectIds, projectId]
      }));
    }
  };

  // Handle project removal
  const handleProjectRemove = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectIds: prev.projectIds.filter(id => id !== projectId)
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
      projectIds: projectIds,
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
            className="w-full rounded-lg border border-input bg-background px-10 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
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
           <DialogContent className="w-5/6 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                      <p className="text-red-600">{formErrors.firstName}</p>
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
                      <p className="text-red-600">{formErrors.lastName}</p>
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
                    <p className="text-red-600">{formErrors.email}</p>
                  )}
                </div>

              {/* Associated Projects */}
                <div className="space-y-2">
                  <Label>Associated Projects</Label>
                  {/* Selected Projects Tags */}
                  {formData.projectIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.projectIds.map((projectId) => {
                        const project = projects.find(p => p.id === projectId);
                        return (
                          <div
                            key={projectId}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800"
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
                        .filter(project => !formData.projectIds.includes(project.id))
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
                        <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                      ) : roles.length === 0 ? (
                        <SelectItem value="no_roles" disabled>No roles available</SelectItem>
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
                    <p className="text-red-600">{formErrors.role}</p>
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
                      <p className="text-red-600">{formErrors.password}</p>
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
        )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 sm:p-4 font-medium sm:text-muted-foreground">Name</th>
                <th className="text-left p-2 sm:p-4 font-medium sm:text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="text-left p-2 sm:p-4 font-medium sm:text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="text-left p-2 sm:p-4 font-medium sm:text-muted-foreground">Role</th>
                <th className="text-left p-2 sm:p-4 font-medium sm:text-muted-foreground hidden lg:table-cell">Projects</th>
                <th className="text-left p-2 sm:p-4 font-medium sm:text-muted-foreground hidden sm:table-cell">Status</th>
                {(hasPermission('users','update') || hasPermission('users','delete')) && (
                  <th className="text-right p-2 sm:p-4 font-medium sm:text-muted-foreground">Actions</th>
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
                  <td className="p-2 sm:p-4">
                    <span className="font-medium">{member.firstName} {member.lastName}</span>
                    <div className=" text-muted-foreground sm:hidden mt-1">{member.email}</div>
                  </td>
                  <td className="p-2 sm:p-4 hidden sm:table-cell">
                    <span className="">{member.email}</span>
                  </td>
                  <td className="p-2 sm:p-4 hidden md:table-cell">
                    <span className="">{member.phone || '-'}</span>
                  </td>
                  <td className="p-2 sm:p-4">
                    <span className="">{member.role.name}</span>
                  </td>

                  <td className="p-2 sm:p-4 hidden lg:table-cell">
                    {member.projectMembers && member.projectMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {member.projectMembers.map((pm, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {pm.project.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No projects</span>
                    )}
                  </td>
                  <td className="p-2 sm:p-4 hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded-full ${
                      member.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4 text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      {hasPermission('users','update') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                      {hasPermission('users','delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
      {/* Delete Member Modal */}
      <DeleteMemberModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        member={deletingMember}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
    
  );
  
};

export default MemberManagement;