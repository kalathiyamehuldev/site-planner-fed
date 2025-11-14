import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/redux/hooks';
import { getProfile, fetchUserPermissions, setPermissions } from '@/redux/slices/authSlice';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Component that initializes the app on page load/refresh
 * - Restores user session if token exists
 * - Fetches user profile and permissions
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      const selectedCompany = localStorage.getItem('selectedCompany');
      const storedPermissions = localStorage.getItem('userPermissions');

      if (token) {
        try {
          // Restore permissions from localStorage immediately
          if (storedPermissions) {
            dispatch(setPermissions(JSON.parse(storedPermissions)));
          }

          // Fetch fresh user profile to get current role and permissions
          const profileResult = await dispatch(getProfile());
          
          if (getProfile.fulfilled.match(profileResult)) {
            const payload: any = profileResult.payload;
            const user = payload?.user || payload?.data?.user || null;
            const permissions = payload?.permissions || payload?.data?.permissions;
            
            // If permissions are already provided in profile response (static permissions for Customer/Vendor), use them
            if (permissions && permissions.length > 0) {
              dispatch(setPermissions(permissions));
            } else if (user?.role?.id) {
              // If user has a role, fetch fresh permissions (for USER type)
              await dispatch(fetchUserPermissions(user.role.id));
            } else if (selectedCompany && user?.userCompanies?.length > 0) {
              // Handle case where user has multiple companies
              const company = JSON.parse(selectedCompany as string);
              const userCompany = user.userCompanies.find((uc: any) => uc.companyId === company.id);
              if (userCompany?.roleId) {
                await dispatch(fetchUserPermissions(userCompany.roleId));
              }
            }
          }
        } catch (error) {
          console.error('Failed to initialize app:', error);
          // Keep stored permissions as fallback
        }
      }

      setIsInitialized(true);
    };

    initializeApp();
  }, [dispatch]);

  // Show loading or return children based on initialization state
  if (!isInitialized) {
    // You can replace this with a proper loading component if needed
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppInitializer;
