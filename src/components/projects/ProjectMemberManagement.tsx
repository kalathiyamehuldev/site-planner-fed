import React, { useState, useEffect, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ActionButton from '@/components/ui/ActionButton';
import {Button} from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { RiArrowUpDownLine } from '@remixicon/react';
 
import { RootState, AppDispatch } from '@/redux/store';
import {
  getProjectMembers,
  addMemberToProject,
  removeMemberFromProject,
  selectProjectMembers,
  selectProjectMembersLoading,
  selectProjectMembersError,
} from "@/redux/slices/projectsSlice";
import { fetchMembers, Member } from "@/redux/slices/adminSlice";
import usePermission from "@/hooks/usePermission";

export interface ProjectMemberManagementRef {
  openAddDialog: () => void;
}

interface ProjectMemberManagementProps {
  projectId: string;
  hideHeader?: boolean;
}

const ProjectMemberManagement = React.forwardRef<ProjectMemberManagementRef, ProjectMemberManagementProps>(({ projectId, hideHeader = false }, ref) => {
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission } = usePermission();
  const resource = 'projects';

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);

  // Redux selectors
  const projectMembers = useSelector(selectProjectMembers(projectId));
  const memberLoading = useSelector(selectProjectMembersLoading);
  const memberError = useSelector(selectProjectMembersError);
  const {
    members: { items: companyMembers, loading: membersLoading },
  } = useSelector((state: RootState) => state.admin);

  // Fetch project members and company members on component mount
  useEffect(() => {
    dispatch(getProjectMembers(projectId));
    dispatch(fetchMembers());
  }, [dispatch, projectId]);

  // Handle adding member to project
  const handleAddMember = async () => {
    if (!selectedUserId || !selectedMember) {
      return;
    }

    try {
      const result = await dispatch(
        addMemberToProject({
          projectId,
          userId: selectedUserId,
          role: selectedMember.role.id,
        })
      );

      if (addMemberToProject.fulfilled.match(result)) {
        setIsAddDialogOpen(false);
        setSelectedUserId("");
        setSelectedMember(null);
      }
    } catch (error) {}
  };

  // Handle removing member from project
  const handleRemoveMember = async (userId: string) => {
    try {
      const result = await dispatch(
        removeMemberFromProject({
          projectId,
          userId,
        })
      );

      if (removeMemberFromProject.fulfilled.match(result)) {}
    } catch (error) {}
  };

  useImperativeHandle(ref, () => ({
    openAddDialog: () => setIsAddDialogOpen(true),
  }));

  // Filter available members (exclude already added members)
  const availableMembers = companyMembers.filter(
    (member) => !projectMembers.some((pm) => pm.user.id === member.id)
  );
  
  // Apply sorting to project members
  let sortedProjectMembers = [...projectMembers];
  if (sortConfig) {
    sortedProjectMembers = sortedProjectMembers.sort((a, b) => {
      let aValue = '';
      let bValue = '';
      switch (sortConfig.key) {
        case 'name':
          aValue = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
          bValue = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
          break;
        case 'email':
          aValue = a.user.email.toLowerCase();
          bValue = b.user.email.toLowerCase();
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
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Project Members</h3>
          {hasPermission(resource, 'create') && (
            <ActionButton 
              variant="primary" 
              motion="subtle"
              text="Add Member"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddDialogOpen(true)}
            />
          )}
        </div>
      )}

      {memberLoading && projectMembers.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading members...</p>
        </div>
      ) : projectMembers.length === 0 ? (
        <div className="text-center py-8">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No members assigned to this project yet.
          </p>
          {hasPermission(resource, 'create') && (
            <div className="mt-4">
              <ActionButton
                variant="primary"
                motion="subtle"
                text="Add Member"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddDialogOpen(true)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full bg-white rounded-md overflow-hidden">
          <div className="sm:hidden">
            <ul className="divide-y">
              {sortedProjectMembers.map((member, index) => (
                <li key={member.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal truncate">
                        {member.user.firstName} {member.user.lastName}
                      </div>
                      <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none truncate">
                        {member.user.email}
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {member.role.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasPermission(resource, 'delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user.id)}
                          disabled={memberLoading}
                          className="w-6 h-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          aria-label="Remove member"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden sm:block overflow-x-auto">
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
                      onClick={() => handleSort('role')}
                      className="text-left font-normal text-sm text-[#2a2e35] font-['Poppins'] leading-tight flex items-center gap-1 hover:text-[#1a2624] transition-colors bg-transparent border-none p-0 cursor-pointer"
                    >
                      Role
                      <RiArrowUpDownLine size={14} />
                    </button>
                  </th>
                  <th className="w-12 px-3 border-b border-[#1a2624]/10">
                    {/* Actions column - empty header */}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedProjectMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className="h-16 hover:bg-gray-50/50 transition-colors animate-fade-in border-b border-[#1a2624]/10"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <td className="px-3 max-w-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[#1a2624] text-sm font-bold font-['Manrope'] leading-normal truncate">
                          {member.user.firstName} {member.user.lastName}
                        </div>
                        {/* Mobile: Show email under name */}
                        <div className="text-[#1a2624]/70 text-xs font-normal font-['Manrope'] leading-none sm:hidden truncate">
                          {member.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 max-w-xs hidden sm:table-cell">
                      <div className="text-[#1a2624] text-sm font-medium font-['Manrope'] leading-tight truncate">
                        {member.user.email}
                      </div>
                    </td>
                    <td className="px-3 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {member.role.name}
                      </span>
                    </td>
                    <td className="px-3">
                      <div className="flex items-center justify-center">
                        {hasPermission(resource, 'delete') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveMember(
                                member.user.id,
                                
                              )
                            }
                            disabled={memberLoading}
                            className="w-6 h-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {memberError && (
        <div className="text-red-600 text-sm mt-2">Error: {memberError}</div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-5/6 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Member to Project</DialogTitle>
            <DialogDescription>
              Select a team member to add to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Select
                value={selectedUserId}
                onValueChange={(value) => {
                  setSelectedUserId(value);
                  const member = companyMembers.find(m => m.id === value);
                  setSelectedMember(member || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={memberLoading || !selectedUserId}
            >
              {memberLoading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ProjectMemberManagement;
