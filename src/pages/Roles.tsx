import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchRoles, deleteRole, selectAllRoles, selectRolesLoading } from '@/redux/slices/rolesSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import usePermission from '@/hooks/usePermission';
import PageContainer from '@/components/layout/PageContainer';
import RoleCard from '@/components/roles/RoleCard';
import { MotionButton } from '@/components/ui/motion-button';
import { cn } from '@/lib/utils';

// Component for managing roles

const RolesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectAllRoles);
  const {hasPermission, isSuperAdmin} = usePermission();
  const isLoading = useAppSelector(selectRolesLoading);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch, hasPermission, isSuperAdmin]);

  const handleCreateRole = () => {
    navigate('/roles/create');
  };

  const handleEditRole = (roleId: string) => {
    navigate(`/roles/edit/${roleId}`);
  };

  const openDeleteDialog = (roleId: string) => {
    setDeleteRoleId(roleId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeleteRoleId(null);
  };

  const handleDelete = async () => {
    try {
      if (deleteRoleId) {
        await dispatch(deleteRole(deleteRoleId)).unwrap();
        toast({ title: "Success", description: "Role deleted successfully" });
        dispatch(fetchRoles());
        closeDeleteDialog();
      }
    } catch (error: any) {
      console.error("Error deleting role:", error);
      toast({ 
        title: "Error", 
        description: error?.message || error?.error || "Failed to delete role. Please try again.", 
        variant: "destructive"
      });
      closeDeleteDialog();
    }
  };
  
  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Super admin or users with manage permission can access roles page
  const canManageRoles = hasPermission('users', 'manage') || isSuperAdmin;
  console.log("canManageRoles in Roles", canManageRoles);
  

  if (!canManageRoles) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-full p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You do not have permission to view or manage roles.</p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Role Management</h1>
            <p className="text-muted-foreground">
              Manage user roles and permissions
            </p>
          </div>
          {hasPermission('roles', 'create') && (
            <MotionButton
              variant="default"
              motion="subtle"
              onClick={handleCreateRole}
            >
              <Plus size={18} className="mr-2" /> Create Role
            </MotionButton>
          )}
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search roles..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && roles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No roles found</p>
            <MotionButton
              variant="default"
              motion="subtle"
              onClick={handleCreateRole}
            >
              <Plus size={18} className="mr-2" /> Create Your First Role
            </MotionButton>
          </div>
        )}

        {/* Roles Grid */}
        {!isLoading && filteredRoles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-[0.2s]">
            {filteredRoles.map((role, index) => (
              <div
                key={role.id}
                className={cn("opacity-0 animate-scale-in", {
                  "animation-delay-[0.1s]": index % 3 === 0,
                  "animation-delay-[0.2s]": index % 3 === 1,
                  "animation-delay-[0.3s]": index % 3 === 2,
                })}
                style={{ animationFillMode: "forwards" }}
              >
                <RoleCard
                  role={role}
                  onEdit={handleEditRole}
                  onDelete={(roleId) => openDeleteDialog(roleId)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                selected role and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageContainer>
  );
};

export default RolesPage;