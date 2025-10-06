import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { cn } from "@/lib/utils";
import { LogOut, Menu, User } from "lucide-react";
import { logout } from "@/redux/slices/authSlice";
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
import solar from "@solar-icons/react";

type SidebarItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

// Mobile header with logo and menu icon
const MobileHeader: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 py-3">
      <Link to="/" className="flex items-center gap-2">
        <img src="/logo/logo.svg" alt="ProjectIQ" className="h-7 w-auto" />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-600 hover:bg-gray-100"
        onClick={onOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
};

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();
  const { state, isMobile, setOpenMobile, setOpen } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";

  // User data (in real app, this would come from Redux/context)
  const userData = {
    name: "Alex Polo",
    role: "Project Manager"
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    return words.length >= 2 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
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
  ];

  const libraryItems: SidebarItem[] = [
    ...(hasPermission("contacts", "manage")
      ? [{ name: "Address Books", path: "/address-book", icon: solar.School.Book }]
      : []),
  ];

  const isActive = (path: string) => {
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
              "p-2 rounded-md transition-colors w-full justify-start gap-2",
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
      <MobileHeader onOpen={() => setOpenMobile(true)} />
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
            // Mobile: User Profile Section + Logout
            <div className="flex flex-col md:gap-3">
              {/* Logout Button */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Log Out"
                    onClick={handleLogout}
                    className="p-2 rounded-md text-gray-900/80 hover:bg-gray-50 justify-start gap-2"
                  >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-normal">Log Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              {/* User Profile Section */}
              <Link 
                to="/profile" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setOpenMobile(false)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                  {getInitials(userData.name)}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {userData.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {userData.role}
                  </div>
                </div>
              </Link>
              
            </div>
          ) : (
            // Desktop: Only Settings (no logout)
            <SidebarMenu className="flex flex-col gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Settings"
                  className="p-2 rounded-md text-gray-900/80 hover:bg-gray-50 justify-start gap-2"
                >
                  <Link to="/settings" className="flex items-center gap-2 w-full">
                    <solar.Settings.SettingsMinimalistic className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-normal">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default AppSidebar;