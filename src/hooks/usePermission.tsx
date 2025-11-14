import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { Resource, Action, hasPermission as hasPermissionUtil, hasAnyPermission as hasAnyPermissionUtil, hasAllPermissions as hasAllPermissionsUtil, isSuperAdmin as isSuperAdminUtil } from '../utils/permissionUtils';
import { RootState } from '../redux/store';
import { ApiPermission } from '../redux/slices/rolesSlice';

/**
 * Custom hook to check user permissions
 * Provides utility functions to check if the current user has specific permissions
 * Company users, Customers, and Vendors have static permissions that bypass database checks
 */
export const usePermission = () => {
  const permissions = useSelector<RootState, ApiPermission[] | undefined>(
    (state) => state.auth.permissions
  );
  
  const user = useSelector<RootState, any>((state) => state.auth.user);
  const isCompanyUser = user?.isCompany === true;
  const userType = user?.userType;
  
  const isSuperAdmin = useCallback(() => {
    // Company users are treated as super admins
    if (isCompanyUser) {
      return true;
    }
    // Customers and Vendors are not super admins but have their own static permissions
    if (userType === 'CUSTOMER' || userType === 'VENDOR') {
      return false;
    }
    const result = isSuperAdminUtil(permissions);
    return result;
  }, [permissions, isCompanyUser, userType]);

  const hasPermission = useCallback(
    (resource: Resource, action: Action): boolean => {
      // Company users bypass permission checks
      if (isCompanyUser) {
        return true;
      }
      
      // Customers and Vendors use their static permissions
      if (userType === 'CUSTOMER' || userType === 'VENDOR') {
        return hasPermissionUtil(permissions, resource, action);
      }
      
      // Regular users use database permissions
      const result = hasPermissionUtil(permissions, resource, action);
      return result;
    },
    [permissions, isCompanyUser, userType]
  );

  const hasAnyPermission = useCallback(
    (permissionRequirements: Array<{ resource: Resource; action: Action }>): boolean => {
      // Company users bypass permission checks
      if (isCompanyUser) {
        return true;
      }
      
      // Customers and Vendors use their static permissions
      if (userType === 'CUSTOMER' || userType === 'VENDOR') {
        return hasAnyPermissionUtil(permissions, permissionRequirements);
      }
      
      // Regular users use database permissions
      const result = hasAnyPermissionUtil(permissions, permissionRequirements);
      return result;
    },
    [permissions, isCompanyUser, userType]
  );

  const hasAllPermissions = useCallback(
    (permissionRequirements: Array<{ resource: Resource; action: Action }>): boolean => {
      // Company users bypass permission checks
      if (isCompanyUser) {
        return true;
      }
      
      // Customers and Vendors use their static permissions
      if (userType === 'CUSTOMER' || userType === 'VENDOR') {
        return hasAllPermissionsUtil(permissions, permissionRequirements);
      }
      
      // Regular users use database permissions
      const result = hasAllPermissionsUtil(permissions, permissionRequirements);
      return result;
    },
    [permissions, isCompanyUser, userType]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    permissions,
    userType
  };
};

export default usePermission;