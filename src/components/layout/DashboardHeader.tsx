import React, { useEffect } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout, getProfile, selectUser } from "@/redux/slices/authSlice";

interface DashboardHeaderProps {
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

const DashboardHeader = ({ 
  userName,
  userRole,
  onLogout 
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  useEffect(() => {
    // If user not loaded yet but token exists, fetch profile
    const token = localStorage.getItem('token');
    if (!user && token) {
      dispatch(getProfile());
    }
  }, [dispatch, user]);

  // Generate avatar initials
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    return words.length >= 2 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Use Redux logout action
      dispatch(logout());
    }
  };

  return (
    // Hide on mobile since AppSidebar provides MobileHeader, show on desktop
    <div className="hidden md:flex items-center justify-between mb-4 sm:mb-10 w-full">
      {/* Left side - Breadcrumb */}
      <div className="flex items-center gap-1 sm:gap-2 text-gray-500 min-w-0 flex-1">
        <h1 className="typography-common font-semibold leading-[100%] text-gray-900">
            Dashboard
        </h1>
      </div>

      {/* Right side - User Profile */}
      <div className="flex-shrink-0 ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg min-w-0"
            >
              {/* Avatar */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0">
                {getInitials(
                  userName || (user ? `${user.firstName} ${user.lastName}` : "User")
                )}
              </div>
              
              {/* User Info - Show on desktop */}
              <div className="text-left min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {userName || (user ? `${user.firstName} ${user.lastName}` : "User")}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                  {userRole || (user?.role?.name ? user.role.name : "")}
                </div>
              </div>
              
              {/* Dropdown Arrow */}
              <ChevronDown size={14} className="text-gray-500 flex-shrink-0 sm:w-4 sm:h-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-40 sm:w-48">
            <DropdownMenuItem
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2"
            >
              <User size={14} className="sm:w-4 sm:h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut size={14} className="sm:w-4 sm:h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default DashboardHeader;