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
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title?: string;
  showProfile?: boolean;
}

const DashboardHeader = ({ 
  title = "Dashboard",
  showProfile = false
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

  // User data from Redux or fallback
  const userData = {
    name: user ? `${user.firstName} ${user.lastName}` : "User",
    role: user?.role?.name || "User"
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    return words.length >= 2 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Generate avatar colors based on user name
  const getAvatarColors = (name: string) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700' },
      { bg: 'bg-green-100', text: 'text-green-700' },
      { bg: 'bg-purple-100', text: 'text-purple-700' },
      { bg: 'bg-pink-100', text: 'text-pink-700' },
      { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      { bg: 'bg-red-100', text: 'text-red-700' },
      { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      { bg: 'bg-teal-100', text: 'text-teal-700' },
      { bg: 'bg-orange-100', text: 'text-orange-700' },
      { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    ];
    
    // Generate a consistent index based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    // Hide on mobile since AppSidebar provides MobileHeader, show on desktop
    <div className="hidden md:flex items-center justify-between mb-4 sm:mb-10 w-full">
      {/* Page Title */}
      <div className="flex items-center gap-1 sm:gap-2 text-gray-500 min-w-0 flex-1">
        <h1 className="typography-common font-semibold leading-[100%] text-gray-900">
          {title}
        </h1>
      </div>

      {/* Right side - User Profile (only show if showProfile is true) */}
      {showProfile && (
        <div className="flex-shrink-0 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg min-w-0"
              >
                {/* Avatar */}
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0",
                  getAvatarColors(userData.name).bg,
                  getAvatarColors(userData.name).text
                )}>
                  {getInitials(userData.name)}
                </div>
                
                {/* User Info - Show on desktop */}
                <div className="text-left min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {userData.name}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {userData.role}
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
      )}
    </div>
  );
};

export default DashboardHeader;