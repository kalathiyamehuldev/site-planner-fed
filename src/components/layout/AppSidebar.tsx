
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  FileText, 
  CheckSquare, 
  Clock, 
  Users, 
  ShoppingBag, 
  FileImage, 
  Package,
  Settings, 
  HelpCircle,
  BookOpen,
  Timer,
  CreditCard,
  FolderArchive,
  LogOut,
  Shield,
  Menu,
  X
} from "lucide-react";
import { logout } from "@/redux/slices/authSlice";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import usePermission from "@/hooks/usePermission";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

type SidebarItem = {
  name: string;
  path: string;
  icon: React.ElementType;
  color: string;
};

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { hasPermission } = usePermission();
  const { isMobile, openMobile, setOpenMobile, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    dispatch(logout());
  };

  const mainItems: SidebarItem[] = [
  { name: "Dashboard", path: "/", icon: LayoutGrid, color: "text-blue-600" },
  ...(hasPermission("projects","manage") ? [{ name: "Projects", path: "/projects", icon: FileText, color: "text-green-600" }] : []),
  ...(hasPermission("tasks","manage") ? [{ name: "Tasks", path: "/tasks", icon: CheckSquare, color: "text-purple-600" }] : []),
  ...(hasPermission("users","manage") ? [{ name: "Admin", path: "/admin", icon: Shield, color: "text-red-600" }] : []),
  ...(hasPermission("roles","manage") ? [{ name: "Roles", path: "/roles", icon: Shield, color: "text-orange-600" }] : []),
];

  const toolItems = [
    ...(hasPermission("time_tracking","manage") ? [{ name: "Time Tracking", path: "/time-tracking", icon: Clock, color: "text-orange-600" }] : []), // resource = time_tracking
    { name: "To-Do List", path: "/todo", icon: CheckSquare, color: "text-indigo-600" },
    // { name: "Invoices", path: "/invoices", icon: CreditCard, color: "text-yellow-600" }, // resource = invoices
    // { name: "Procurement Hub", path: "/procurement", icon: ShoppingBag, color: "text-pink-600" },
    // { name: "Purchase Orders", path: "/purchase-orders", icon: ShoppingBag, color: "text-teal-600" },
     ...(hasPermission("documents","manage") ? [{ name: "Documents", path: "/documents", icon: FolderArchive, color: "text-gray-600" }] : []), // resource = documents
  ];

  const libraryItems = [
    ...(hasPermission("contacts","manage") ? [{  name: "Address Book", path: "/address-book", icon: Users, color: "text-cyan-600" }] : []), // resource = contacts
    // { name: "Image Library", path: "/image-library", icon: FileImage, color: "text-emerald-600" },
    // { name: "Product Library", path: "/product-library", icon: Package, color: "text-violet-600" },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== "/" && location.pathname.startsWith(path));
  };

  const SidebarMenuItems = ({ items }: { items: { name: string; path: string; icon: React.ElementType; color: string }[] }) => {
    return (
      <>
        {items.map((item) => (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton 
              asChild
              isActive={isActive(item.path)}
              tooltip={item.name}
              onClick={() => isMobile && setOpenMobile(false)}
            >
              <Link to={item.path}>
                <item.icon className={cn(
                  "transition-colors duration-200",
                  isActive(item.path) ? "text-slate-800" : item.color
                )} />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </>
    );
  };

  // Mobile menu toggle button that appears in the header
  const MobileMenuToggle = () => {
    if (!isMobile) return null;
    
    return (
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
            D
          </div>
          <span className="text-lg font-light tracking-tight">designflow</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpenMobile(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </div>
    );
  };

  return (
    <>
      <MobileMenuToggle />
      <Sidebar variant="inset" collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="pt-6 px-4">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                D
              </div>
              <span className="text-xl font-light tracking-tight">designflow</span>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setOpenMobile(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close Menu</span>
              </Button>
            )}
            {!isMobile && <SidebarTrigger className="hidden md:flex" />}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItems items={mainItems.filter(Boolean) as SidebarItem[]} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItems items={toolItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Libraries</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItems items={libraryItems} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link to="/settings">
                  <Settings
                    size={18}
                    className={cn(
                      "transition-colors duration-200",
                      isActive("/settings") ? "text-primary-foreground" : "text-slate-600"
                    )}
                  />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Log Out" onClick={handleLogout}>
                <LogOut
                  size={18}
                  className="text-red-600 transition-colors duration-200"
                />
                <span>Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
};

export default AppSidebar;
