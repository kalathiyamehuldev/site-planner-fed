import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/lib/utils";
import { LogOut, Menu, User, ChevronDown, ChevronRight } from "lucide-react";
import { logout, selectUser } from "@/redux/slices/authSlice";
import { 
  fetchNotifications,
  fetchNotificationCounts,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  createTestNotification,
  selectNotifications,
  selectUnreadNotifications,
  selectReadNotifications,
  selectUnreadCount,
  selectTotalCount,
  selectActiveFilter,
  selectFilteredNotifications,
  setActiveFilter
} from "@/redux/slices/notificationsSlice";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import usePermission from "@/hooks/usePermission";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import solar, { Gallery } from "@solar-icons/react";
import AddTaskDialog from "@/components/tasks/AddTaskDialog";
import AddProjectDialog from "@/components/projects/AddProjectDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

type SidebarItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

// Mobile header with logo and menu icon
const MobileHeader: React.FC<{ 
  onOpen: () => void;
  onNotificationClick: () => void;
  onQuickAddClick: () => void;
  unreadCount: number;
}> = ({ onOpen, onNotificationClick, onQuickAddClick, unreadCount }) => {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 py-3 h-16 mobile-header-fixed">
      {/* Left group: menu + logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:bg-gray-100 flex-shrink-0"
          onClick={onOpen}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Link to="/" className="flex items-center">
          <img src="/logo/logo.svg" alt="ProjectIQ" className="h-7 w-auto" />
        </Link>
      </div>

      {/* Right group: bell + add square */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:bg-gray-100 flex-shrink-0 relative"
          onClick={onNotificationClick}
        >
          <solar.Notifications.Bell color="#1C274C" weight="LineDuotone" className="text-[#3a3a3a] w-7 h-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:bg-gray-100 flex-shrink-0"
          onClick={onQuickAddClick}
        >
          <solar.Ui.AddSquare weight="LineDuotone" color="#1C274C" className="h-7 w-7 text-gray-700" />
        </Button>
      </div>
    </div>
  );
};

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const unreadCount = useAppSelector(selectUnreadCount);
  const totalCount = useAppSelector(selectTotalCount);
  const notifications = useAppSelector(selectNotifications);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const readNotifications = useAppSelector(selectReadNotifications);
  const activeFilter = useAppSelector(selectActiveFilter);
  const filteredNotifications = useAppSelector(selectFilteredNotifications);
  const { hasPermission } = usePermission();
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  // Fetch notifications on mount - single API call, counts computed from data
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleNotificationClick = (notificationId: string, link?: string) => {
    dispatch(markAsRead(notificationId));
    if (link) {
      navigate(link);
    }
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
    dispatch(setActiveFilter(filter));
    // No need to fetch again - filtering happens on frontend
  };

  const handleCreateTestNotification = () => {
    dispatch(createTestNotification());
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  };

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

  const mainItems: SidebarItem[] = [
    { name: "Dashboard", path: "/", icon: solar.Settings.Widget5 },
    ...(hasPermission("projects", "manage")
      ? [{ name: "Projects", path: "/projects", icon: solar.Tools.Layers }]
      : []),
    ...(hasPermission("tasks", "manage")
      ? [{ name: "Tasks", path: "/tasks", icon: solar.Notes.ArchiveMinimalistic }]
      : []),
    ...(hasPermission("users", "manage")
      ? [{ name: "Admin", path: "/admin", icon: solar.Security.ShieldUser }]
      : []),
    ...(hasPermission("roles", "manage")
      ? [{ name: "Roles", path: "/roles", icon: solar.Security.ShieldStar }]
      : []),
  ];

  const toolItems: SidebarItem[] = [
    ...(hasPermission("time_tracking", "manage")
      ? [{ name: "Time Tracking", path: "/time-tracking", icon: solar.Time.Stopwatch }]
      : []),
    { name: "To-Do-List", path: "/todo", icon: solar.List.ChecklistMinimalistic },
    ...(hasPermission("documents", "manage")
      ? [{ name: "Documents", path: "/documents", icon: solar.Folders.FolderWithFiles }]
      : []),
    ...(hasPermission("photos", "read")
      ? [{ name: "Photos", path: "/photos", icon: Gallery }]
      : []),
  ];

  const libraryItems: SidebarItem[] = [
    ...(hasPermission("contacts", "manage")
      ? [{ name: "Address Books", path: "/address-book", icon: solar.School.Book }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === "/photos") {
      return (
        location.pathname.startsWith("/photos") ||
        location.pathname.startsWith("/albums")
      );
    }
    return location.pathname === path || (path !== "/" && location.pathname.startsWith(path));
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  // Drag rail to toggle open/close on desktop (fluid, no fixed widths)
  const onRailMouseDown: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (isMobile) return; // Only desktop
    const startX = e.clientX;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      if (dx > 30) setOpen(true);
      if (dx < -30) setOpen(false);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  };

  const SidebarMenuItems = ({ items }: { items: SidebarItem[] }) => (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            asChild
            isActive={isActive(item.path)}
            tooltip={item.name}
            className={cn(
              "p-2 rounded-sm transition-colors w-full justify-start gap-2",
              isActive(item.path)
                ? "bg-[#1b78f9] text-white hover:bg-[#1b78f9]"
                : "text-gray-900/80 hover:bg-gray-50"
            )}
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <Link to={item.path} className="flex items-center gap-2 w-full">
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive(item.path)
                    ? "text-white"
                    : "text-gray-900/80"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  isActive(item.path)
                    ? "text-white font-medium"
                    : "text-gray-900/80 font-normal"
                )}
              >
                {item.name}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );

  return (
    <>
      <MobileHeader 
        onOpen={() => setOpenMobile(true)}
        onNotificationClick={() => setShowNotifications(true)}
        onQuickAddClick={() => setShowQuickAddMenu(true)}
        unreadCount={unreadCount}
      />
      <Sidebar variant="inset" collapsible="icon" className="bg-white">
        <SidebarRail onMouseDown={onRailMouseDown} />
        <SidebarHeader className={cn("p-4", isCollapsed ? "px-0" : "")}>
          <div className="flex items-center justify-between rounded-md mb-8">
            {isCollapsed ? (
              <button
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                onClick={() => setOpen(true)}
              >
                <img src="/logo/logo_small.svg" alt="ProjectIQ" className="w-auto" />
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <img src="/logo/logo.svg" alt="ProjectIQ" className="h-9 w-auto" />
                {!isMobile && (
                  <SidebarTrigger className="h-5 w-5 text-[#7a7c81] hover:bg-gray-50 hover:text-gray-700" />
                )}
              </div>
            )}

            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setOpenMobile(false)}
                aria-label="Close menu"
              >
                ×
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className={`flex-1 flex flex-col gap-4 ${!isCollapsed ? "px-4" : "mx-auto"}`}>
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col md:gap-2">
                <SidebarMenuItems items={mainItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator line */}
          <div className="h-0 border-t border-gray-900/10" />

          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col md:gap-2">
                <SidebarMenuItems items={toolItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Separator line */}
          <div className="h-0 border-t border-gray-900/10" />

          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="flex flex-col md:gap-2">
                <SidebarMenuItems items={libraryItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-4">
          {isMobile ? (
            // Mobile: Always show expanded profile options
            <div className="flex flex-col gap-2">
              {/* Settings */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/settings")}
                    tooltip="Settings"
                    className={cn(
                      "p-2 rounded-sm transition-colors w-full justify-start gap-2",
                      isActive("/settings")
                        ? "bg-[#1b78f9] text-white hover:bg-[#1b78f9]"
                        : "text-gray-900/80 hover:bg-gray-50"
                    )}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link to="/settings" className="flex items-center gap-2 w-full">
                      <solar.Settings.SettingsMinimalistic 
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive("/settings") ? "text-white" : "text-gray-900/80"
                        )} 
                      />
                      <span 
                        className={cn(
                          "text-sm",
                          isActive("/settings") 
                            ? "text-white font-medium" 
                            : "text-gray-900/80 font-normal"
                        )}
                      >
                        Settings
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              {/* Separator line */}
              <div className="h-0 border-t border-gray-900/10" />

              {/* User Profile Section - Always expanded on mobile */}
              <div className="flex flex-col gap-2">
                {/* User Info Display */}
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className={cn(
                    "w-10 h-10 rounded-sm flex items-center justify-center text-sm font-medium flex-shrink-0",
                    getAvatarColors(userData.name).bg,
                    getAvatarColors(userData.name).text
                  )}>
                    {getInitials(userData.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {userData.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {userData.role}
                    </div>
                  </div>
                </div>

                {/* Profile and Logout Menu Items */}
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/profile")}
                      tooltip="Profile"
                      className={cn(
                        "p-2 rounded-sm transition-colors w-full justify-start gap-2",
                        isActive("/profile")
                          ? "bg-[#1b78f9] text-white hover:bg-[#1b78f9]"
                          : "text-gray-900/80 hover:bg-gray-50"
                      )}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Link to="/profile" className="flex items-center gap-2 w-full">
                        <User 
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive("/profile") ? "text-white" : "text-gray-900/80"
                          )} 
                        />
                        <span 
                          className={cn(
                            "text-sm",
                            isActive("/profile") 
                              ? "text-white font-medium" 
                              : "text-gray-900/80 font-normal"
                          )}
                        >
                          Profile
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Log Out"
                      onClick={handleLogout}
                      className="p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 justify-start gap-2"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-normal">Log Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </div>
          ) : (
            // Desktop: Collapsible profile section
            <div className="flex flex-col gap-2">
              {/* Settings */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/settings")}
                    tooltip="Settings"
                    className={cn(
                      "p-2 rounded-sm transition-colors w-full justify-start gap-2",
                      isActive("/settings")
                        ? "bg-[#1b78f9] text-white hover:bg-[#1b78f9]"
                        : "text-gray-900/80 hover:bg-gray-50"
                    )}
                  >
                    <Link to="/settings" className="flex items-center gap-2 w-full">
                      <solar.Settings.SettingsMinimalistic 
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive("/settings") ? "text-white" : "text-gray-900/80"
                        )} 
                      />
                      <span 
                        className={cn(
                          "text-sm",
                          isActive("/settings") 
                            ? "text-white font-medium" 
                            : "text-gray-900/80 font-normal"
                        )}
                      >
                        Settings
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              {/* Separator line */}
              <div className="h-0 border-t border-gray-900/10" />

              {/* User Profile Section - Collapsible on desktop */}
              <div className="flex flex-col gap-2">
                {/* User Profile Toggle Button */}
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={isCollapsed ? userData.name : "User Menu"}
                      onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                      className="p-2 rounded-sm text-gray-900/80 hover:bg-gray-50 justify-start gap-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className={cn(
                          "w-8 h-8 rounded-sm flex items-center justify-center text-sm font-medium flex-shrink-0",
                          getAvatarColors(userData.name).bg,
                          getAvatarColors(userData.name).text
                        )}>
                          {getInitials(userData.name)}
                        </div>
                        
                        {!isCollapsed && (
                          <>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {userData.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {userData.role}
                              </div>
                            </div>
                            
                            {/* Expand/Collapse Arrow */}
                            {isProfileExpanded ? (
                              <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
                            )}
                          </>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>

                {/* Expandable Profile and Logout Menu Items */}
                {isProfileExpanded && !isCollapsed && (
                  <div className="ml-4 flex flex-col gap-1">
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive("/profile")}
                          tooltip="Profile"
                          className={cn(
                            "p-2 rounded-sm transition-colors w-full justify-start gap-2",
                            isActive("/profile")
                              ? "bg-[#1b78f9] text-white hover:bg-[#1b78f9]"
                              : "text-gray-900/80 hover:bg-gray-50"
                          )}
                          onClick={() => setIsProfileExpanded(false)}
                        >
                          <Link to="/profile" className="flex items-center gap-2 w-full">
                            <User 
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive("/profile") ? "text-white" : "text-gray-900/80"
                              )} 
                            />
                            <span 
                              className={cn(
                                "text-sm",
                                isActive("/profile") 
                                  ? "text-white font-medium" 
                                  : "text-gray-900/80 font-normal"
                              )}
                            >
                              Profile
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          tooltip="Log Out"
                          onClick={() => {
                            handleLogout();
                            setIsProfileExpanded(false);
                          }}
                          className="p-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 justify-start gap-2"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-normal">Log Out</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </div>
                )}
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Mobile Quick Add Menu */}
      <Sheet open={showQuickAddMenu} onOpenChange={setShowQuickAddMenu}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Quick Add</SheetTitle>
          </SheetHeader>
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setShowQuickAddMenu(false);
                setShowTaskDialog(true);
              }}
            >
              <solar.Notes.ArchiveMinimalistic className="h-5 w-5 mr-2" />
              Create Task
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setShowQuickAddMenu(false);
                setShowProjectDialog(true);
              }}
            >
              <solar.Tools.Layers className="h-5 w-5 mr-2" />
              Create Project
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Notifications */}
      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-sm text-blue-600 hover:text-blue-700"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={handleCreateTestNotification}
                >
                  Test 
                </Button> */}
              </div>
            </div>
            {/* Filter Tabs */}
            <div className="overflow-x-auto mt-4">
              <div className="flex items-center gap-1 min-w-fit">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1 px-3 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleFilterChange('all')}
                >
                  All ({totalCount})
                </Button>
                <Button
                  variant={activeFilter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1 px-3 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleFilterChange('unread')}
                >
                  Unread ({unreadCount})
                </Button>
                <Button
                  variant={activeFilter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  className="h-auto py-1 px-3 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => handleFilterChange('read')}
                >
                  Read ({totalCount - unreadCount})
                </Button>
              </div>
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(80vh-120px)] mt-4">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {activeFilter === 'unread' && 'No unread notifications'}
                {activeFilter === 'read' && 'No read notifications'}
                {activeFilter === 'all' && 'No notifications yet'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border group relative",
                      !notification.read
                        ? "bg-blue-50/50 border-blue-100"
                        : "bg-white border-gray-200"
                    )}
                    onClick={() =>
                      handleNotificationClick(notification.id, notification.link)
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              New
                            </span>
                          )}
                          {notification.category && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              {notification.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Show related project/task info if available */}
                        {(notification.project || notification.task) && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            {notification.project && (
                              <span className="flex items-center gap-1">
                                📁 {notification.project.name}
                              </span>
                            )}
                            {notification.task && (
                              <span className="flex items-center gap-1">
                                📋 {notification.task.title}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (notification.read) {
                              dispatch(markAsUnread(notification.id));
                            } else {
                              dispatch(markAsRead(notification.id));
                            }
                          }}
                        >
                          {notification.read ? (
                            <span className="text-xs">↩</span>
                          ) : (
                            <span className="text-xs">✓</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Task Dialog */}
      <AddTaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        projectId=""
        fromProject={false}
      />

      {/* Project Dialog */}
      <AddProjectDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        mode="create"
      />
    </>
  );
};

export default AppSidebar;
