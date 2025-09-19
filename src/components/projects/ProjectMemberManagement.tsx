import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RootState, AppDispatch } from '@/redux/store';
import {
  getProjectMembers,
  addMemberToProject,
  removeMemberFromProject,
  ProjectMember,
} from "@/redux/slices/projectsSlice";
import { fetchMembers, Member } from "@/redux/slices/adminSlice";
import usePermission from "@/hooks/usePermission";

interface ProjectMemberManagementProps {
  projectId: string;
}

const ProjectMemberManagement: React.FC<ProjectMemberManagementProps> = ({
  projectId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const resource = 'projects';

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Redux selectors
  const {
    members: { items: companyMembers, loading: membersLoading },
  } = useSelector((state: RootState) => state.admin);

  // Fetch project members and company members on component mount
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (projectId) {
        setMemberLoading(true);
        setMemberError(null);
        try {
          const result = await dispatch(getProjectMembers(projectId));
          if (getProjectMembers.fulfilled.match(result)) {
            setProjectMembers(result.payload.members);
          } else {
            setMemberError(result.payload as string || 'Failed to fetch project members');
          }
        } catch (error) {
          setMemberError('Failed to fetch project members');
        } finally {
          setMemberLoading(false);
        }
      }
    };

    fetchProjectMembers();
    dispatch(fetchMembers());
  }, [dispatch, projectId]);

  // Handle adding member to project
  const handleAddMember = async () => {
    if (!selectedUserId || !selectedMember) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
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
        toast({
          title: "Success",
          description: "Member added to project successfully",
        });

        // Refresh project members
        const refreshResult = await dispatch(getProjectMembers(projectId));
        if (getProjectMembers.fulfilled.match(refreshResult)) {
          setProjectMembers(refreshResult.payload.members);
        }

        setIsAddDialogOpen(false);
        setSelectedUserId("");
        setSelectedMember(null);
      } else {
        toast({
          title: "Error",
          description: (result.payload as string) || "Failed to add member",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add member to project",
        variant: "destructive",
      });
    }
  };

  // Handle removing member from project
  const handleRemoveMember = async (userId: string, memberName: string) => {
    try {
      const result = await dispatch(
        removeMemberFromProject({
          projectId,
          userId,
        })
      );

      if (removeMemberFromProject.fulfilled.match(result)) {
        toast({
          title: "Success",
          description: `${memberName} removed from project successfully`,
        });

        // Refresh project members
        const refreshResult = await dispatch(getProjectMembers(projectId));
        if (getProjectMembers.fulfilled.match(refreshResult)) {
          setProjectMembers(refreshResult.payload.members);
        }
      } else {
        toast({
          title: "Error",
          description: (result.payload as string) || "Failed to remove member",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member from project",
        variant: "destructive",
      });
    }
  };

  // Filter available members (exclude already added members)
  const availableMembers = companyMembers.filter(
    (member) => !projectMembers.some((pm) => pm.user.id === member.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Members</h3>
        {hasPermission(resource, 'create') && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member to Project</DialogTitle>
                <DialogDescription>
                  Select a team member to add to this project and assign their
                  role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Member</label>
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
              {/* <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                    <SelectItem value="EDITOR">Editor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
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
        )}
      </div>

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
          <p className="text-sm text-gray-500 mt-1">
            Click "Add Member" to get started.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.user.firstName} {member.user.lastName}
                </TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {member.role.name}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {hasPermission(resource, 'delete') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleRemoveMember(
                          member.user.id,
                          `${member.user.firstName} ${member.user.lastName}`
                        )
                      }
                      disabled={memberLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {memberError && (
        <div className="text-red-600 text-sm mt-2">Error: {memberError}</div>
      )}
    </div>
  );
};

export default ProjectMemberManagement;