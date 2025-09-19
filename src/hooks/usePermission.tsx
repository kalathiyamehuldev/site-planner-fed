import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { Resource, Action, hasPermission as hasPermissionUtil, hasAnyPermission as hasAnyPermissionUtil, hasAllPermissions as hasAllPermissionsUtil, isSuperAdmin as isSuperAdminUtil } from '../utils/permissionUtils';
import { RootState } from '../redux/store';
import { ApiPermission } from '../redux/slices/rolesSlice';

/**
 * Custom hook to check user permissions
 * Provides utility functions to check if the current user has specific permissions
 */
export const usePermission = () => {
  const permissions = useSelector<RootState, ApiPermission[] | undefined>(
    (state) => state.auth.permissions
  );
  
  console.log('usePermission hook initialized');
  console.log('Current permissions from store:', permissions);

  const isSuperAdmin = useCallback(() => {
    console.log('isSuperAdmin check called');
    const result = isSuperAdminUtil(permissions);
    console.log('isSuperAdmin result:', result);
    return result;
  }, [permissions]);

  const hasPermission = useCallback(
    (resource: Resource, action: Action): boolean => {
      console.log('hasPermission called with:', { resource, action });
      const result = hasPermissionUtil(permissions, resource, action);
      console.log('hasPermission result:', result);
      return result;
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (permissionRequirements: Array<{ resource: Resource; action: Action }>): boolean => {
      console.log('hasAnyPermission called with:', permissionRequirements);
      const result = hasAnyPermissionUtil(permissions, permissionRequirements);
      console.log('hasAnyPermission result:', result);
      return result;
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (permissionRequirements: Array<{ resource: Resource; action: Action }>): boolean => {
      console.log('hasAllPermissions called with:', permissionRequirements);
      const result = hasAllPermissionsUtil(permissions, permissionRequirements);
      console.log('hasAllPermissions result:', result);
      return result;
    },
    [permissions]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    permissions
  };
};

export default usePermission;