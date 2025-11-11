import { ApiPermission } from '../redux/slices/rolesSlice';

export type Resource = 'projects' | 'documents' | 'tasks' | 'time_tracking' | 'invoices' | 'contacts' | 'folders' | 'users' | 'dashboard' | 'admin' | 'roles' | 'todo' | 'purchase_orders' | 'image_library' | 'product_library' | 'photos';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface PermissionActions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  manage: boolean;
}

export interface PermissionSet {
  [resource: string]: PermissionActions;
}

/**
 * Convert API permission array to permission object for easier lookup
 */
export const convertPermissionsToObject = (permissions: ApiPermission[]): PermissionSet => {
  return permissions.reduce((acc, permission) => {
    acc[permission.resource] = permission.actions;
    return acc;
  }, {} as PermissionSet);
};

/**
 * Check if user has specific permission for a resource
 */
export const hasPermission = (
  permissions: ApiPermission[] | null,
  resource: Resource,
  action: Action
): boolean => {
  
  if (!permissions) {
    return false;
  }
  
  const resourcePermission = permissions.find(p => p.resource === resource);
  if (!resourcePermission) {
    return false;
  }
  
  // Special case for sidebar visibility: only need manage permission for 'read' action
  if (action === 'read' && resourcePermission.actions.manage) {
    return true;
  }
  
  // For other actions, check the specific permission only
  // This ensures manage permission doesn't automatically grant other permissions
  const hasAction = resourcePermission.actions[action] || false;
  return hasAction;
};

/**
 * Get permission hierarchy for a specific action
 * Follows the hierarchy: manage > read > create > update > delete
 */
export const getPermissionHierarchy = (action: Action): Action[] => {
  switch (action) {
    case 'manage':
      return ['manage'];
    case 'read':
      return ['manage', 'read'];
    case 'create':
      return ['manage', 'read', 'create'];
    case 'update':
      return ['manage', 'read', 'update'];
    case 'delete':
      return ['manage', 'read', 'create', 'update', 'delete'];
    default:
      return [action];
  }
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  permissions: ApiPermission[] | null,
  requirements: Array<{ resource: Resource; action: Action }>
): boolean => {
  if (!permissions) return false;
  
  return requirements.some(({ resource, action }) => 
    hasPermission(permissions, resource, action)
  );
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  permissions: ApiPermission[] | null,
  requirements: Array<{ resource: Resource; action: Action }>
): boolean => {
  if (!permissions) return false;
  
  return requirements.every(({ resource, action }) => 
    hasPermission(permissions, resource, action)
  );
};

/**
 * Get human-readable name for resource
 */
export const getResourceName = (resource: Resource): string => {
  const resourceNames: Record<Resource, string> = {
    projects: 'Projects',
    documents: 'Documents',
    tasks: 'Tasks',
    time_tracking: 'Time Tracking',
    invoices: 'Invoices',
    contacts: 'Contacts',
    folders: 'Folders',
    users: 'Users',
    dashboard: 'Dashboard',
    admin: 'Admin',
    roles: 'Roles',
    todo: 'To Do',
    purchase_orders: 'Purchase Orders',
    image_library: 'Image Library',
    product_library: 'Product Library',
    photos: 'Photos'
  };
  
  return resourceNames[resource] || resource;
};

/**
 * Get human-readable name for action
 */
export const getActionName = (action: Action): string => {
  const actionNames: Record<Action, string> = {
    create: 'Create',
    read: 'View',
    update: 'Edit',
    delete: 'Delete',
    manage: 'Manage'
  };
  
  return actionNames[action] || action;
};

/**
 * Filter array based on user permissions
 */
export const filterByPermission = <T>(
  items: T[],
  permissions: ApiPermission[] | null,
  resource: Resource,
  action: Action
): T[] => {
  if (hasPermission(permissions, resource, action)) {
    return items;
  }
  return [];
};

/**
 * Check if user is a Super Admin
 * Super Admin is determined by having no role permissions (empty array)
 */
export const isSuperAdmin = (permissions: ApiPermission[] | null): boolean => {
  return Array.isArray(permissions) && permissions.length === 0;
};