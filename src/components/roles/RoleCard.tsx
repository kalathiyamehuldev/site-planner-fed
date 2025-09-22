import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Edit, Trash2, Check, X } from 'lucide-react';
import { ApiRole } from '@/redux/slices/rolesSlice';
import usePermission from '@/hooks/usePermission';

interface RoleCardProps {
  role: ApiRole;
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const {hasPermission} = usePermission();
  // Count permissions
  const permissionCount = role.permissions?.reduce((count, permission) => {
    return count + Object.values(permission.actions).filter(Boolean).length;
  }, 0) || 0;
  
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">{role.name}</CardTitle>
          </div>
          <div className="flex space-x-1">
            {hasPermission('roles', 'update') && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(role.id)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {!role.isDefault && hasPermission('roles', 'delete') && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(role.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="mt-1">
          {role.description || 'No description provided'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{permissionCount}</span> permissions granted
          </p>
          
          {role.permissions && role.permissions.length > 0 && (
          <div className="mt-2 space-y-4">
            {role.permissions.map(permission => {
              // Collect allowed actions
              const allowedActions = Object.entries(permission.actions)
                .filter(([_, hasPermission]) => hasPermission)
                .map(([action]) => action);

              // Skip if no actions
              if (allowedActions.length === 0) return null;

              // Capitalize resource label
              const resourceLabel = permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1);

              return (
                <div className='' key={permission.resource}>
                  {/* Resource label */}
                  <div className="font-bold text-sm tracking-wide uppercase mb-2">
                    {resourceLabel}:
                  </div>

                  {/* Permission badges */}
                  <div className="flex flex-wrap gap-2">
                    {/* Permission badges */}
                    {allowedActions.map(action => {
                      const actionLabel =
                        action.charAt(0).toUpperCase() + action.slice(1);
                      return (
                        <Badge
                          key={`${permission.resource}-${action}`}
                          variant="outline"
                          className="text-xs px-2 py-0.5"
                        >
                          {actionLabel}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleCard;