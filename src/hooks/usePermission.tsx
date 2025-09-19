import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { Resource, Action, hasPermission as hasPermissionUtil, hasAnyPermission as hasAnyPermissionUtil, hasAllPermissions as hasAllPermissionsUtil, isSuperAdmin as isSuperAdminUtil } from '../utils/permissionUtils';
import { RootState } from '../redux/store';
import { ApiPermission } from '../redux/slices/rolesSlice';

/**
 * Custom hook to check user permissions
 * Provides utility functions to check if the current user has specific permissions
 * Company users bypass permission checks and have full access
 */
export const usePermission = () => {
  const permissions = useSelector<RootState, ApiPermission[] | undefined>(
    (state) => state.auth.permissions
  );
  
  const user = useSelector<RootState, any>((state) => state.auth.user);
  const isCompanyUser = user?.isCompany === true;
    const isSuperAdmin = useCallback(() => {
    // Company users are treated as super admins
    if (isCompanyUser) {
      return true;
    }
    const result = isSuperAdminUtil(permissions);
    return result;
  }, [permissions, isCompanyUser]);

  const hasPermission = useCallback(
    (resource: Resource, action: Action): boolean => {
      // Company users bypass permission checks
      if (isCompanyUser) {
        console.log('Company user detected, bypassing permission check');
        return true;
      }
      const result = hasPermissionUtil(permissions, resource, action);
      return result;
    },
    [permissions, isCompanyUser]
  );

  const hasAnyPermission = useCallback(
    (permissionRequirements: Array<{ resource: Resource; action: Action }>): boolean => {
      // Company users bypass permission checks
      if (isCompanyUser) {
        return true;
      }
      const result = hasAnyPermissionUtil(permissions, permissionRequirements);
      return result;
    },
    [permissions, isCompanyUser]
  );

  const hasAllPermissions = useCallback(
    (permissionRequirements: Array<{ resource: Resource; action: Action }>): boolean => {
      // Company users bypass permission checks
      if (isCompanyUser) {
        return true;
      }
      const result = hasAllPermissionsUtil(permissions, permissionRequirements);
      return result;
    },
    [permissions, isCompanyUser]
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