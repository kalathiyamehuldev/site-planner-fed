import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { Plus, Edit, Trash2, Search, Eye, User, Mail, Phone } from 'lucide-react';
import solar from '@solar-icons/react';
import { RiArrowUpDownLine } from '@remixicon/react';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
import { cn } from '@/lib/utils';
import * as yup from 'yup';
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

// Yup validation schema
const memberValidationSchema = yup.object().shape({
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: yup.string().required('Email is required').email('Please enter a valid email address'),
  phone: yup.string().optional(),
  address: yup.string().optional(),
  roleId: yup.string().required('Role is required'),
  password: yup.string().when('isEditing', {
    is: false,
    then: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
    otherwise: (schema) => schema.optional()
  }),
  projectIds: yup.array().optional()
});

const MemberManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
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
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Generate avatar initials and color for members
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



  const handleMemberCardClick = (member: Member) => {
    setSelectedMember(member);
    setActionSheetOpen(true);
  };

  const validateForm = async (): Promise<boolean> => {
    try {
      await memberValidationSchema.validate({
        ...formData,
        isEditing: !!editingMember
      }, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors: FormErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            if (err.path === 'roleId') {
              errors.role = err.message;
            } else {
              errors[err.path as keyof FormErrors] = err.message;
            }
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

    const isValid = await validateForm();
    if (!isValid) {
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

  let filteredMembers = membersList.filter(
    (member) =>
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Apply sorting
  if (sortConfig) {
    filteredMembers = [...filteredMembers].sort((a, b) => {
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
        case 'role':
          aValue = a.role.name.toLowerCase();
          bValue = b.role.name.toLowerCase();
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
            placeholder="Search members..."
            className="w-full h-10 rounded-lg border border-input bg-background px-10 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 justify-center md:justify-end">
        {hasPermission('users', 'create') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="hidden md:flex items-center gap-2">
            <DialogTrigger asChild>
              <ActionButton 
                variant="primary" 
                motion="subtle"
                onClick={() => {
                  setEditingMember(null);
                  resetForm();
                }}
                text="Add Member"
                leftIcon={<Plus className="h-4 w-4" />}
              />
            </DialogTrigger>
          </div>
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
                  <Label htmlFor="role">Role <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => handleInputChange('roleId', value)}
                    required
                  >
                    <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
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
                    <p className="text-sm text-red-500">{formErrors.role}</p>
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
                {!editingMember && (
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
                  text={loading ? 'Saving...' : editingMember ? 'Update' : 'Create'}
                />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
        </div>
      </div>

      {/* Mobile and Desktop Views */}
      {isMobile ? (
        /* Mobile Card View */
        <div className="space-y-3 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading members...</div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <h4 className="text-muted-foreground">No members found...</h4>
            </div>
          ) : (
            filteredMembers.map((member, index) => {
              const avatarData = getAvatarData(member.firstName, member.lastName);
              
              return (
                <GlassCard
                  key={member.id}
                  variant="clean"
                  className="p-4 cursor-pointer hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 animate-fade-in border border-gray-200 hover:border-gray-300 bg-white shadow-sm"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                  onClick={() => handleMemberCardClick(member)}
                >
                  <div className="space-y-3">
                    {/* Member Name */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{
                          backgroundColor: avatarData.bgColor,
                          color: avatarData.color
                        }}
                      >
                        {avatarData.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-800 text-base font-semibold font-['Poppins'] line-clamp-1">
                          {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm font-normal font-['Poppins']">{member.role.name}</p>
                      </div>
                    </div>

                    {/* Role Row */}
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {member.role.name}
                      </span>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-100" />

                    {/* Contact Info Row */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700 text-sm font-medium truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-700 text-sm font-medium">{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Projects Section */}
                    {member.projectMembers && member.projectMembers.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-gray-600 text-xs font-medium">Projects:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.projectMembers.slice(0, 3).map((pm, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {pm.project.name}
                            </span>
                          ))}
                          {member.projectMembers.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{member.projectMembers.length - 3} more
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
            <table className="w-full min-w-[600px] sm:min-w-[700px] md:min-w-[800px] table-auto">
              <thead className="h-12">
                <tr className="border-b border-[#1a2624]/10">
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight">
                    <button
                      onClick={() => handleSort('name')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Name
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('email')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Email
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  {/* <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight w-20 sm:w-24 md:w-28 hidden md:table-cell">
                    <button
                      onClick={() => handleSort('phone')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Phone
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th> */}
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight">
                    <button
                      onClick={() => handleSort('role')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Role
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  <th className="text-left px-3 font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight hidden lg:table-cell">
                    Projects
                  </th>
                  <th className="min-w-[48px] w-auto px-3 border-b border-[#1a2624]/10">
                    {/* Actions column - empty header */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="text-lg">Loading members...</div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <h4 className="text-muted-foreground">No members found...</h4>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className="h-16 hover:bg-gray-50/50 transition-colors animate-fade-in border-b border-[#1a2624]/10"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <td className="px-3 max-w-[360px]">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal truncate">
                          {member.firstName} {member.lastName}
                        </div>
                        {/* Mobile: Show email under name */}
                        <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none sm:hidden truncate">
                          {member.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 max-w-[520px] hidden sm:table-cell">
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight truncate">
                        {member.email}
                      </div>
                    </td>
                    {/* <td className="px-3 hidden md:table-cell">
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight">
                        {member.phone || '-'}
                      </div>
                    </td> */}
                    <td className="px-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {member.role.name}
                      </span>
                    </td>
                    <td className="px-3 max-w-[420px] hidden lg:table-cell">
                      {member.projectMembers && member.projectMembers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.projectMembers.map((pm, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {pm.project.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#1a2624]/70 text-sm font-normal font-['Manrope']">No projects</span>
                      )}
                    </td>
                    <td className="px-3 min-w-[48px] w-auto">
                      <div className="flex items-center justify-center gap-1">
                        {hasPermission('users','update') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                            className="w-6 h-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </Button>
                        )}
                        {hasPermission('users','delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member)}
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
            setEditingMember(null);
            resetForm();
            setIsDialogOpen(true);
          }}
          className="md:hidden fixed bottom-6 right-6 rounded-2xl bg-[#1b78f9] text-white shadow-lg p-2"
        >
          <solar.Ui.AddSquare className="w-6 h-6" style={{ width: 24, height: 24 }} />
        </Button>
      )}
      {/* Delete Member Modal */}
      <DeleteMemberModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        member={deletingMember}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      {/* Bottom Sheet for Member Actions */}
      <BottomSheet
        isOpen={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        title={selectedMember ? `${selectedMember.firstName} ${selectedMember.lastName}` : "Member Actions"}
      >
        <div className="space-y-4">
          {/* View Member Details */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-3">
              {selectedMember && (
                <>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const avatarData = getAvatarData(selectedMember.firstName, selectedMember.lastName);
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
                      <h3 className="font-semibold text-gray-800">{selectedMember.firstName} {selectedMember.lastName}</h3>
                      <p className="text-sm text-gray-600">{selectedMember.role.name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="text-gray-700">{selectedMember.email}</span>
                    </div>
                    {selectedMember.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-500" />
                        <span className="text-gray-700">{selectedMember.phone}</span>
                      </div>
                    )}
                  </div>

                  {selectedMember.projectMembers && selectedMember.projectMembers.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Projects:</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedMember.projectMembers.map((pm, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {pm.project.name}
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
            {/* Edit Member */}
            {hasPermission('users', 'update') && selectedMember && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  handleEdit(selectedMember);
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit size={20} className="text-blue-600" />
                <span className="text-gray-800 font-medium">Edit Member</span>
              </button>
            )}

            {/* Delete Member */}
            {hasPermission('users', 'delete') && selectedMember && (
              <button
                onClick={() => {
                  setActionSheetOpen(false);
                  handleDelete(selectedMember);
                }}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} className="text-red-600" />
                <span className="text-red-600 font-medium">Delete Member</span>
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
    
  );
  
};

export default MemberManagement;
