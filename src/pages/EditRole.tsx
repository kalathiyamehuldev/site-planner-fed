import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { updateRole, fetchRoles, selectAllRoles } from '@/redux/slices/rolesSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import usePermission from '@/hooks/usePermission';
import PageContainer from '@/components/layout/PageContainer';

// Define resource and action types
const RESOURCES = ['projects', 'documents', 'tasks', 'time_tracking', 'invoices', 'contacts', 'folders', 'users', 'roles'] as const;
const ACTIONS = [ 'manage' , 'read', 'create', 'update', 'delete'] as const;

type Resource = typeof RESOURCES[number];
type Action = typeof ACTIONS[number];

type RoleFormData = {
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  permissions: {
    resource: Resource;
    actions: Record<Action, boolean>;
  }[];
};

const EditRolePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { roleId } = useParams<{ roleId: string }>();
  const roles = useAppSelector(selectAllRoles);
  const { hasPermission, isSuperAdmin } = usePermission();
  
  // Check if user has permission to manage roles
  const canManageRoles = hasPermission('users', 'manage') || isSuperAdmin;
  
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

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
    permissions: RESOURCES.map(resource => ({
      resource,
      actions: ACTIONS.reduce((acc, action) => ({ ...acc, [action]: false }), {}
      ) as Record<Action, boolean>
    }))
  });

  const [loading, setLoading] = useState(true);

  // State to track if roles have been fetched
  const [rolesFetched, setRolesFetched] = useState(false);
  
  useEffect(() => {
    // Fetch roles if not already loaded
    if (roles.length === 0 && !rolesFetched) {
      setRolesFetched(true);
      dispatch(fetchRoles()).then(() => {
        setLoading(false);
        loadRoleData();
      });
    } else if (roleId) {
      setLoading(false);
      loadRoleData();
    }
  }, [dispatch, roleId, roles.length, rolesFetched]);

  const loadRoleData = () => {
    console.log('Loading role data for ID:', roleId);
    if (!roleId) {
      navigate('/roles');
      return;
    }

    const role = roles.find(r => r.id === roleId);
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
        isDefault: role.isDefault || false,
        isActive: role.isActive !== false,
        permissions: RESOURCES.map(resource => ({
          resource,
          actions: role.permissions?.find(p => p.resource === resource)?.actions || 
            ACTIONS.reduce((acc, action) => ({ ...acc, [action]: false }), {}
            ) as Record<Action, boolean>
        }))
      });
    } else {
      navigate('/roles');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, resource: Resource, action: Action) => {
    const { checked } = e.target;
    
    setFormData(prev => {
      const resourcePermission = prev.permissions.find(p => p.resource === resource);
      if (!resourcePermission) return prev;
      
      let updatedActions = { ...resourcePermission.actions };
      
      if (checked) {
        // When checking a permission, also check all permissions it depends on
        // Following hierarchy: manage > read > create > update > delete
        if (action === 'manage') {
          updatedActions.manage = true;
          updatedActions.read = false;
          updatedActions.create = false;
          updatedActions.update = false;
          updatedActions.delete = false;
        } else if (action === 'read') {
          updatedActions.manage = true;
          updatedActions.read = true;
          updatedActions.create = false;
          updatedActions.update = false;
          updatedActions.delete = false;
        } else if (action === 'create') {
          updatedActions.manage = true;
          updatedActions.read = true;
          updatedActions.create = true;
          updatedActions.update = false;
          updatedActions.delete = false;
        } else if (action === 'update') {
          updatedActions.manage = true;
          updatedActions.read = true;
          updatedActions.create = true;
          updatedActions.update = true;
          updatedActions.delete = false;
        } else if (action === 'delete') {
          updatedActions.manage = true;
          updatedActions.read = true;
          updatedActions.create = true;
          updatedActions.update = true;
          updatedActions.delete = true;
        }
      } else {
        // When unchecking, only uncheck the specific permission
        updatedActions[action] = false;
      }
      
      return {
        ...prev,
        permissions: prev.permissions.map(perm => 
          perm.resource === resource 
            ? { ...perm, actions: updatedActions }
            : perm
        )
      };
    });
  };

  // Type-safe toggle handler for boolean fields only
  const handleBooleanToggle = (field: 'isDefault' | 'isActive') => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!roleId) return;
      
      // Get companyId from localStorage or auth state
      const selectedCompany = JSON.parse(localStorage.getItem('selectedCompany') || '{}');
      const companyId = selectedCompany?.id;
      
      if (!companyId) {
        throw new Error('No company selected');
      }
      
      // Format the role data properly for the API
      const roleData = {
        name: formData.name,
        description: formData.description,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
        companyId: companyId,
        permissions: formData.permissions.map(perm => ({
          resource: perm.resource,
          actions: perm.actions
        }))
      };
      
      await dispatch(updateRole({ id: roleId, roleData })).unwrap();
      toast({ title: "Success", description: "Role updated successfully" });
      navigate('/roles');
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({ 
        title: "Error", 
        description: error?.message || error?.error || "Failed to update role. Please try again.", 
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-full p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit Role</h1>
          <Button variant="outline" onClick={() => navigate('/roles')}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>
              Update the role details and permissions.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium block">
                    Role Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                    required
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium block">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter role description"
                    rows={3}
                    className="w-full"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={() => handleBooleanToggle('isDefault')}
                      disabled
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium">
                      Default Role (cannot be changed)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={() => handleBooleanToggle('isActive')}
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">
                      Active
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Permissions</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.permissions.map((permission) => (
                    <Card key={permission.resource} className="overflow-hidden">
                      <CardHeader className="py-2 px-4 bg-muted">
                        <CardTitle className="text-base">
                          {permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1).replace('_', ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-2 gap-2">
                          {ACTIONS.map((action) => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${permission.resource}-${action}`}
                                checked={permission.actions[action]}
                                onCheckedChange={(checked) => 
                                  handleCheckboxChange({
                                    target: { checked: typeof checked === 'boolean' ? checked : false }
                                  } as React.ChangeEvent<HTMLInputElement>, 
                                  permission.resource, 
                                  action)
                                }
                              />
                              <label 
                                htmlFor={`${permission.resource}-${action}`}
                                className="text-xs font-medium"
                              >
                                {action.charAt(0).toUpperCase() + action.slice(1)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <CardFooter className="pt-2">
                <Button type="submit" className="w-full sm:w-auto">
                  Update Role
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
    </PageContainer>
  );
};

export default EditRolePage;