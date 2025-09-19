import React, { ReactNode } from 'react';
import usePermission from '@/hooks/usePermission';

interface PermissionWrapperProps {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 通用权限检查组件，用于包装需要权限控制的UI元素
 * 如果用户有权限，则显示children，否则显示fallback（默认为null）
 */
const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  resource,
  action,
  children,
  fallback = null
}) => {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

export default PermissionWrapper;